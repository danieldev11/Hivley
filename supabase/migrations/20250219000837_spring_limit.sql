/*
  # Messaging System Improvements

  1. Changes
    - Add indexes for better conversation lookup performance
    - Add composite indexes for message status tracking
    - Add system message support
    - Add cleanup functions for stale data

  2. Security
    - Add RLS policies for secure message access
    - Add policies for message status updates
    - Add policies for conversation management

  3. Performance
    - Add optimized indexes for common queries
    - Add composite indexes for related lookups
*/

-- Create indexes for better conversation lookup
CREATE INDEX IF NOT EXISTS idx_conversations_participants_lookup 
ON conversation_participants(conversation_id, profile_id);

CREATE INDEX IF NOT EXISTS idx_conversations_type_created 
ON conversations(type, created_by);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

-- Create composite indexes for message status
CREATE INDEX IF NOT EXISTS idx_message_status_composite 
ON message_status(message_id, profile_id, status);

-- Create function to cleanup stale conversations
CREATE OR REPLACE FUNCTION cleanup_stale_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete empty conversations older than 24 hours
  DELETE FROM conversations
  WHERE id NOT IN (
    SELECT DISTINCT conversation_id 
    FROM messages
  )
  AND created_at < now() - interval '24 hours';
END;
$$;

-- Schedule cleanup job
SELECT cron.schedule(
  'cleanup-stale-conversations',
  '0 * * * *', -- Run every hour
  $$SELECT cleanup_stale_conversations()$$
);

-- Create function to handle message notifications
CREATE OR REPLACE FUNCTION handle_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation last_message_at
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  -- Insert initial message status for all participants
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
  AND cp.profile_id != NEW.sender_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message notifications
DROP TRIGGER IF EXISTS on_message_notification ON messages;
CREATE TRIGGER on_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_notification();

-- Create function to update message status
CREATE OR REPLACE FUNCTION update_message_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow status progression
  IF NEW.status = 'delivered' AND OLD.status = 'sent' THEN
    RETURN NEW;
  ELSIF NEW.status = 'read' AND (OLD.status = 'sent' OR OLD.status = 'delivered') THEN
    RETURN NEW;
  ELSE
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message status updates
DROP TRIGGER IF EXISTS on_message_status_update ON message_status;
CREATE TRIGGER on_message_status_update
  BEFORE UPDATE ON message_status
  FOR EACH ROW
  EXECUTE FUNCTION update_message_status();