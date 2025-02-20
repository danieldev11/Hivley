-- Drop existing functions
DROP FUNCTION IF EXISTS delete_user(uuid);
DROP FUNCTION IF EXISTS delete_user_complete(uuid);

-- Create improved delete_user_complete function
CREATE OR REPLACE FUNCTION delete_user_complete(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete verification logs first
  DELETE FROM auth.email_verification_logs WHERE user_id = target_user_id;

  -- Delete from admin_users if exists
  DELETE FROM admin_users WHERE profile_id = target_user_id;

  -- Delete from user_metadata
  DELETE FROM user_metadata WHERE id = target_user_id;

  -- Delete from profiles
  DELETE FROM profiles WHERE id = target_user_id;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Create improved RPC function
CREATE OR REPLACE FUNCTION delete_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the complete deletion function
  PERFORM delete_user_complete(user_id);
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise
    RAISE WARNING 'Error during user deletion: %', SQLERRM;
    RAISE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION delete_user TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_complete TO authenticated;

-- Add CASCADE to foreign key constraint
ALTER TABLE auth.email_verification_logs 
  DROP CONSTRAINT IF EXISTS email_verification_logs_user_id_fkey,
  ADD CONSTRAINT email_verification_logs_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;