-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view message status" ON message_status;
DROP POLICY IF EXISTS "Users can insert message status" ON message_status;
DROP POLICY IF EXISTS "Users can update own message status" ON message_status;

-- Create simplified policies for messages
CREATE POLICY "Public read access for messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public insert access for messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Update own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Create simplified policies for message_status
CREATE POLICY "Public read access for message status"
  ON message_status
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public insert access for message status"
  ON message_status
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Update own message status"
  ON message_status
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender 
  ON messages(conversation_id, sender_id);

CREATE INDEX IF NOT EXISTS idx_message_status_message_profile 
  ON message_status(message_id, profile_id);