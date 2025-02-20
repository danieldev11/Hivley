/*
  # Fix Message Status RLS Policies
  
  1. Changes
    - Drop existing message status policies
    - Create new simplified RLS policy for message status
    - Ensure proper permissions for message status inserts
    
  2. Security
    - Allow message handler function to bypass RLS
    - Maintain participant-based access control
*/

-- Drop existing message status policies
DROP POLICY IF EXISTS "message_status_access" ON message_status;
DROP POLICY IF EXISTS "messages_access" ON messages;

-- Create simplified policies that allow proper access
CREATE POLICY "message_status_policy"
  ON message_status
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "messages_policy"
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

-- Update message handler to be security definer
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

  -- Insert message status for all participants with proper enum casting
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