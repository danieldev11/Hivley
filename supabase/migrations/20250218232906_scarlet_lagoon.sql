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
DROP POLICY IF EXISTS "View conversations as participant" ON conversations;
DROP POLICY IF EXISTS "Create conversations" ON conversations;
DROP POLICY IF EXISTS "Update own conversations" ON conversations;
DROP POLICY IF EXISTS "View conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Join conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Update participant status" ON conversation_participants;

-- Create non-recursive policies for conversations
CREATE POLICY "Access own conversations"
  ON conversations
  FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (created_by = auth.uid());

-- Create non-recursive policies for conversation participants
CREATE POLICY "Access conversation participants"
  ON conversation_participants
  FOR ALL
  TO authenticated
  USING (
    profile_id = auth.uid() OR
    conversation_id IN (
      SELECT id 
      FROM conversations 
      WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    profile_id = auth.uid() OR
    conversation_id IN (
      SELECT id 
      FROM conversations 
      WHERE created_by = auth.uid()
    )
  );

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
  ON conversations(created_by);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_composite 
  ON conversation_participants(conversation_id, profile_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_profile 
  ON conversation_participants(profile_id);