/*
  # Fix conversation policies to avoid recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create simplified policies for conversations and participants
    - Add indexes for better performance
    
  2. Security
    - Maintain data access control
    - Prevent unauthorized access
    - Enable proper conversation management
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view conversations they're part of" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations they're invited to" ON conversation_participants;

-- Create simplified policies for conversations
CREATE POLICY "View conversations as participant"
  ON conversations
  FOR SELECT
  USING (
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT profile_id 
      FROM conversation_participants 
      WHERE conversation_id = id
    )
  );

CREATE POLICY "Create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Update own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Create simplified policies for conversation participants
CREATE POLICY "View conversation participants"
  ON conversation_participants
  FOR SELECT
  USING (
    profile_id = auth.uid() OR
    conversation_id IN (
      SELECT id FROM conversations
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Join conversations"
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

CREATE POLICY "Update participant status"
  ON conversation_participants
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
  ON conversations(created_by);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_composite 
  ON conversation_participants(conversation_id, profile_id);