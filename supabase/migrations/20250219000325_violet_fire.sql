-- First drop the trigger that depends on the column
DROP TRIGGER IF EXISTS on_message_delete ON messages;

-- Then drop the function
DROP FUNCTION IF EXISTS handle_message_delete();

-- Now we can safely drop the column
ALTER TABLE messages DROP COLUMN IF EXISTS deleted_at;

-- Add system_message column to messages
ALTER TABLE messages ADD COLUMN is_system_message boolean DEFAULT false;

-- Create function to handle message updates
CREATE OR REPLACE FUNCTION handle_message_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation last_message_at
  UPDATE conversations
  SET last_message_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message updates
CREATE TRIGGER on_message_update
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_update();

-- Create function to handle conversation cleanup
CREATE OR REPLACE FUNCTION cleanup_empty_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete conversations with no messages and older than 24 hours
  DELETE FROM conversations
  WHERE id NOT IN (
    SELECT DISTINCT conversation_id FROM messages
  )
  AND created_at < now() - interval '24 hours';
END;
$$;

-- Schedule conversation cleanup
SELECT cron.schedule(
  'cleanup-empty-conversations',
  '0 * * * *', -- Run every hour
  $$SELECT cleanup_empty_conversations()$$
);