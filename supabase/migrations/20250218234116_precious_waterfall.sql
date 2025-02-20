-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view message status" ON message_status;
DROP POLICY IF EXISTS "Users can update message status" ON message_status;
DROP POLICY IF EXISTS "Users can insert message status" ON message_status;

-- Create comprehensive policies for message_status
CREATE POLICY "Users can view message status"
  ON message_status
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_status.message_id
      AND cp.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert message status"
  ON message_status
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_status.message_id
      AND cp.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own message status"
  ON message_status
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_message_status_lookup 
  ON message_status(message_id, profile_id);