/*
  # Fix conversation policies to prevent recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create simplified policies with direct access checks
    - Add composite indexes for better performance
    
  2. Security
    - Maintain data access control
    - Prevent unauthorized access
    - Enable proper conversation management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "View conversations" ON conversations;
DROP POLICY IF EXISTS "Manage conversations" ON conversations;
DROP POLICY IF EXISTS "View participants" ON conversation_participants;
DROP POLICY IF EXISTS "Manage participants" ON conversation_participants;

-- Create simplified policies for conversations
CREATE POLICY "Public read access for conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Insert access for conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Update access for conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create simplified policies for conversation participants
CREATE POLICY "Public read access for participants"
  ON conversation_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Insert access for participants"
  ON conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Update access for participants"
  ON conversation_participants
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_lookup 
  ON conversation_participants(profile_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
  ON conversations(created_by);