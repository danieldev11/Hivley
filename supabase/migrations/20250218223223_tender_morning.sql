-- Create a function to handle complete user deletion
CREATE OR REPLACE FUNCTION delete_user_complete(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_exists boolean;
BEGIN
  -- Check if profile exists
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = target_user_id
  ) INTO profile_exists;

  -- Delete from admin_users if exists
  DELETE FROM admin_users WHERE profile_id = target_user_id;

  -- Delete from user_metadata
  DELETE FROM user_metadata WHERE id = target_user_id;

  -- Delete from profiles if exists
  IF profile_exists THEN
    DELETE FROM profiles WHERE id = target_user_id;
  END IF;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Create a function that can be called via RPC
CREATE OR REPLACE FUNCTION delete_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Call the complete deletion function
  PERFORM delete_user_complete(user_id);
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION delete_user TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_complete TO authenticated;