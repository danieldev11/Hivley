/*
  # Final Messaging System Fix
  
  1. Changes
    - Remove all complex triggers and functions
    - Create single, simple message handler
    - Remove unnecessary columns
    - Simplify policies
    
  2. Security
    - Basic access control
    - Simple participant validation
*/

-- Drop all existing triggers
DROP TRIGGER IF EXISTS handle_new_message_trigger ON messages;
DROP TRIGGER IF EXISTS on_message ON messages;
DROP TRIGGER IF EXISTS on_message_notification ON messages;
DROP TRIGGER IF EXISTS on_message_status_update ON message_status;
DROP TRIGGER IF EXISTS on_message_delete ON messages;
DROP TRIGGER IF EXISTS on_message_cleanup ON messages;
DROP TRIGGER IF EXISTS on_new_message ON messages;

-- Drop all existing functions
DROP FUNCTION IF EXISTS handle_message();
DROP FUNCTION IF EXISTS handle_message_notification();
DROP FUNCTION IF EXISTS handle_message_status();
DROP FUNCTION IF EXISTS handle_deleted_messages();
DROP FUNCTION IF EXISTS handle_new_message();
DROP FUNCTION IF EXISTS cleanup_messages();

-- Drop all existing policies
DROP POLICY IF EXISTS "messages_policy" ON messages;
DROP POLICY IF EXISTS "message_status_policy" ON message_status;
DROP POLICY IF EXISTS "message_access_policy" ON messages;
DROP POLICY IF EXISTS "message_status_access_policy" ON message_status;

-- Create single message handler
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
CREATE TRIGGER handle_new_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message();

-- Create simple policies
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

-- Add optimized indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time 
ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_time 
ON messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_status_composite 
ON message_status(message_id, profile_id, status);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_lookup 
ON conversation_participants(conversation_id, profile_id);