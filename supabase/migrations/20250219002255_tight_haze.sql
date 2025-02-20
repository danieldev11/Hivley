/*
  # Fix Messaging System

  1. Changes
    - Remove all unnecessary complexity
    - Fix message status handling
    - Simplify conversation lookup
    - Add proper indexes

  2. Performance
    - Add optimized indexes
    - Improve query performance
    - Fix conversation participant lookup
*/

-- Drop triggers with CASCADE to handle dependencies
DROP TRIGGER IF EXISTS on_message_notification ON messages CASCADE;
DROP TRIGGER IF EXISTS on_message_status_update ON message_status CASCADE;
DROP TRIGGER IF EXISTS on_message_delete ON messages CASCADE;
DROP TRIGGER IF EXISTS on_message_cleanup ON messages CASCADE;
DROP TRIGGER IF EXISTS on_new_message ON messages CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS handle_message_notification() CASCADE;
DROP FUNCTION IF EXISTS handle_message_status() CASCADE;
DROP FUNCTION IF EXISTS handle_deleted_messages() CASCADE;
DROP FUNCTION IF EXISTS handle_new_message() CASCADE;

-- Remove unnecessary columns
ALTER TABLE messages 
DROP COLUMN IF EXISTS encrypted_content,
DROP COLUMN IF EXISTS deleted_at;

ALTER TABLE conversations
DROP COLUMN IF EXISTS encryption_key;

ALTER TABLE conversation_participants
DROP COLUMN IF EXISTS encryption_key;

-- Create simple message handler
CREATE OR REPLACE FUNCTION handle_message()
RETURNS TRIGGER AS $$
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
      WHEN cp.profile_id = NEW.sender_id THEN 'read'
      ELSE 'sent'
    END
  FROM conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
  ON CONFLICT (message_id, profile_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create single message trigger
CREATE TRIGGER on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message();

-- Add optimized indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time 
ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_lookup 
ON conversation_participants(conversation_id, profile_id);

CREATE INDEX IF NOT EXISTS idx_message_status_lookup 
ON message_status(message_id, profile_id);

-- Drop existing policies first
DROP POLICY IF EXISTS "Access messages" ON messages;
DROP POLICY IF EXISTS "Access message status" ON message_status;
DROP POLICY IF EXISTS "Public read access for messages" ON messages;
DROP POLICY IF EXISTS "Public insert access for messages" ON messages;
DROP POLICY IF EXISTS "Update own messages" ON messages;
DROP POLICY IF EXISTS "Public read access for message status" ON message_status;
DROP POLICY IF EXISTS "Public insert access for message status" ON message_status;
DROP POLICY IF EXISTS "Update own message status" ON message_status;

-- Create new simplified policies
CREATE POLICY "message_access_policy"
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

CREATE POLICY "message_status_access_policy"
  ON message_status
  FOR ALL
  TO authenticated
  USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_status.message_id
      AND cp.profile_id = auth.uid()
    )
  )
  WITH CHECK (profile_id = auth.uid());