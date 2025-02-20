/*
  # Fix Message Status Enum Handling
  
  1. Changes
    - Fix message status enum handling in trigger function
    - Ensure proper type casting for message_delivery_status
    
  2. Security
    - Maintain existing policies
    - No changes to access control
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS handle_new_message_trigger ON messages;
DROP FUNCTION IF EXISTS handle_message();

-- Create improved message handler with proper enum casting
CREATE OR REPLACE FUNCTION handle_message()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Recreate trigger with fixed function
CREATE TRIGGER handle_new_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message();