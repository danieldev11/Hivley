/*
  # Fix Messaging System

  1. Changes
    - Remove all unnecessary complexity
    - Fix message status handling
    - Simplify conversation lookup
    - Add proper indexes
    - Remove problematic triggers

  2. Performance
    - Add optimized indexes
    - Improve query performance
    - Fix conversation participant lookup
*/

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_message_notification ON messages;
DROP TRIGGER IF EXISTS on_message_status_update ON message_status;
DROP TRIGGER IF EXISTS on_message_delete ON messages;
DROP TRIGGER IF EXISTS on_message_cleanup ON messages;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_message_notification();
DROP FUNCTION IF EXISTS handle_message_status();
DROP FUNCTION IF EXISTS handle_deleted_messages();

-- Create simple message notification handler
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation last_message_at
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  -- Insert initial message status
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
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create simple message trigger
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_message();

-- Add optimized indexes
CREATE INDEX IF NOT EXISTS idx_messages_lookup 
ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_lookup 
ON conversation_participants(conversation_id, profile_id);

CREATE INDEX IF NOT EXISTS idx_message_status_lookup 
ON message_status(message_id, profile_id);

-- Create simplified policies
DROP POLICY IF EXISTS "Public read access for messages" ON messages;
DROP POLICY IF EXISTS "Public insert access for messages" ON messages;
DROP POLICY IF EXISTS "Update own messages" ON messages;

CREATE POLICY "Access messages"
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