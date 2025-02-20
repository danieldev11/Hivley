-- Add deleted_at column to messages table
ALTER TABLE messages
ADD COLUMN deleted_at timestamptz;

-- Create index for better query performance
CREATE INDEX idx_messages_deleted_at ON messages(deleted_at)
WHERE deleted_at IS NULL;

-- Update delete_message function to use soft delete
CREATE OR REPLACE FUNCTION handle_message_delete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = now();
  NEW.content = '[Message deleted]';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for soft delete
CREATE TRIGGER on_message_delete
  BEFORE UPDATE OF deleted_at ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_delete();