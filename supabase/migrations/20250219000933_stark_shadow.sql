/*
  # Fix Message Status Duplication

  1. Changes
    - Update message notification handler to use upsert
    - Add ON CONFLICT clause to prevent duplicates
    - Improve message status handling

  2. Performance
    - Add additional indexes for better lookup performance
    - Optimize message status queries
*/

-- Drop existing message notification trigger and function
DROP TRIGGER IF EXISTS on_message_notification ON messages;
DROP FUNCTION IF EXISTS handle_message_notification();

-- Create improved message notification handler
CREATE OR REPLACE FUNCTION handle_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation last_message_at
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  -- Insert or update message status for all participants
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
  AND cp.profile_id != NEW.sender_id
  ON CONFLICT (message_id, profile_id) 
  DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = now()
  WHERE message_status.status != EXCLUDED.status;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new message notification trigger
CREATE TRIGGER on_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_notification();

-- Add unique constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'message_status_message_id_profile_id_key'
  ) THEN
    ALTER TABLE message_status
    ADD CONSTRAINT message_status_message_id_profile_id_key 
    UNIQUE (message_id, profile_id);
  END IF;
END $$;

-- Add additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_status_profile_message 
ON message_status(profile_id, message_id);

CREATE INDEX IF NOT EXISTS idx_message_status_updated 
ON message_status(updated_at DESC);

-- Update message status update function
CREATE OR REPLACE FUNCTION update_message_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow status progression
  IF NEW.status = 'delivered' AND OLD.status = 'sent' THEN
    NEW.updated_at = now();
    RETURN NEW;
  ELSIF NEW.status = 'read' AND (OLD.status = 'sent' OR OLD.status = 'delivered') THEN
    NEW.updated_at = now();
    RETURN NEW;
  ELSE
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;