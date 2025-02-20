/*
  # Fix Messaging System

  1. Changes
    - Drop existing triggers and functions
    - Remove unnecessary columns
    - Add improved message handling
    - Add proper indexes
    - Fix conversation lookup
    - Remove unnecessary encryption

  2. Performance
    - Add composite indexes
    - Optimize queries
    - Improve message delivery tracking
*/

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_message_notification ON messages;
DROP TRIGGER IF EXISTS on_message_status_update ON message_status;
DROP TRIGGER IF EXISTS on_message_cleanup ON messages;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_message_notification();
DROP FUNCTION IF EXISTS update_message_status();
DROP FUNCTION IF EXISTS cleanup_messages();

-- Remove unnecessary columns
ALTER TABLE messages 
DROP COLUMN IF EXISTS encrypted_content,
DROP COLUMN IF EXISTS deleted_at;

ALTER TABLE conversations
DROP COLUMN IF EXISTS encryption_key;

ALTER TABLE conversation_participants
DROP COLUMN IF EXISTS encryption_key;

-- Create improved message notification handler
CREATE OR REPLACE FUNCTION handle_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  participant_id uuid;
BEGIN
  -- Update conversation last_message_at
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  -- Insert message status for each participant
  FOR participant_id IN 
    SELECT profile_id 
    FROM conversation_participants 
    WHERE conversation_id = NEW.conversation_id 
    AND profile_id != NEW.sender_id
  LOOP
    INSERT INTO message_status (message_id, profile_id, status)
    VALUES (NEW.id, participant_id, 'sent')
    ON CONFLICT (message_id, profile_id) DO NOTHING;
  END LOOP;

  -- Mark as read for sender
  INSERT INTO message_status (message_id, profile_id, status)
  VALUES (NEW.id, NEW.sender_id, 'read')
  ON CONFLICT (message_id, profile_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create message notification trigger
CREATE TRIGGER on_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_notification();

-- Create function to handle message status updates
CREATE OR REPLACE FUNCTION handle_message_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate status progression
  IF NEW.status = 'delivered' AND OLD.status = 'sent' THEN
    NEW.updated_at = now();
    RETURN NEW;
  ELSIF NEW.status = 'read' AND OLD.status IN ('sent', 'delivered') THEN
    NEW.updated_at = now();
    RETURN NEW;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create message status trigger
CREATE TRIGGER on_message_status_update
  BEFORE UPDATE ON message_status
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_status();

-- Add composite indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time 
ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_time 
ON messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_status_composite 
ON message_status(message_id, profile_id, status);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_lookup 
ON conversation_participants(conversation_id, profile_id);

-- Create function to handle deleted messages
CREATE OR REPLACE FUNCTION handle_deleted_messages()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content = '[Message deleted]' THEN
    NEW.edited_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deleted messages
CREATE TRIGGER on_message_delete
  BEFORE UPDATE OF content ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_deleted_messages();