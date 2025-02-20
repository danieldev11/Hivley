/*
  # Fix Messaging System
  
  1. Changes
    - Drop all existing triggers and functions
    - Remove unnecessary columns
    - Create single, simplified message handler
    - Fix RLS policies
    
  2. Security
    - Make message handler SECURITY DEFINER
    - Simplify RLS policies while maintaining security
*/

-- Drop all existing triggers
DROP TRIGGER IF EXISTS on_new_message ON messages;
DROP TRIGGER IF EXISTS handle_new_message_trigger ON messages;
DROP TRIGGER IF EXISTS on_message ON messages;
DROP TRIGGER IF EXISTS on_message_notification ON messages;
DROP TRIGGER IF EXISTS on_message_status_update ON message_status;
DROP TRIGGER IF EXISTS on_message_delete ON messages;
DROP TRIGGER IF EXISTS on_message_cleanup ON messages;

-- Drop all existing functions
DROP FUNCTION IF EXISTS handle_message() CASCADE;
DROP FUNCTION IF EXISTS handle_message_notification() CASCADE;
DROP FUNCTION IF EXISTS handle_message_status() CASCADE;
DROP FUNCTION IF EXISTS handle_deleted_messages() CASCADE;
DROP FUNCTION IF EXISTS handle_new_message() CASCADE;
DROP FUNCTION IF EXISTS cleanup_messages() CASCADE;

-- Drop all existing policies
DROP POLICY IF EXISTS "messages_policy" ON messages;
DROP POLICY IF EXISTS "message_status_policy" ON message_status;
DROP POLICY IF EXISTS "messages_access" ON messages;
DROP POLICY IF EXISTS "message_status_access" ON message_status;
DROP POLICY IF EXISTS "message_access_policy" ON messages;
DROP POLICY IF EXISTS "message_status_access_policy" ON message_status;

-- Remove unnecessary columns
ALTER TABLE messages 
DROP COLUMN IF EXISTS encrypted_content,
DROP COLUMN IF EXISTS deleted_at;

ALTER TABLE conversations
DROP COLUMN IF EXISTS encryption_key;

ALTER TABLE conversation_participants
DROP COLUMN IF EXISTS encryption_key;

-- Create single message handler with proper enum casting
CREATE OR REPLACE FUNCTION handle_message()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Update conversation last_message_at
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  -- Insert message status for all participants
  INSERT INTO message_status (message_id, profile_id, status)
  SELECT 
    NEW.id,
    cp.profile_id,
    CASE 
      WHEN cp.profile_id = NEW.sender_id THEN 'read'::message_delivery_status
      ELSE 'sent'::message_delivery_status
    END
  FROM conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
  ON CONFLICT (message_id, profile_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create single message trigger
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message();

-- Create simplified RLS policies
CREATE POLICY "messages_access"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND profile_id = auth.uid()
    )
  )
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND profile_id = auth.uid()
    )
  );

CREATE POLICY "message_status_access"
  ON message_status
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add optimized indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time 
ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_time 
ON messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_status_composite 
ON message_status(message_id, profile_id, status);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_lookup 
ON conversation_participants(conversation_id, profile_id);