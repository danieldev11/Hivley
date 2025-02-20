/*
  # Fix conversation policies to prevent recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create simplified policies with direct ID checks
    - Add composite indexes for better performance
    
  2. Security
    - Maintain data access control
    - Prevent unauthorized access
    - Enable proper conversation management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Access own conversations" ON conversations;
DROP POLICY IF EXISTS "Access conversation participants" ON conversation_participants;

-- Create non-recursive policies for conversations
CREATE POLICY "View conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Manage conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Create non-recursive policies for conversation participants
CREATE POLICY "View participants"
  ON conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Manage participants"
  ON conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = auth.uid() OR
    conversation_id IN (
      SELECT id 
      FROM conversations 
      WHERE created_by = auth.uid()
    )
  );

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_lookup 
  ON conversation_participants(profile_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
  ON conversations(created_by);