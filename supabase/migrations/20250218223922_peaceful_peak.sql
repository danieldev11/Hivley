-- Drop existing functions first
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
  -- Delete from admin_users if exists
  DELETE FROM admin_users WHERE profile_id = target_user_id;

  -- Delete from user_metadata
  DELETE FROM user_metadata WHERE id = target_user_id;

  -- Delete from profiles
  DELETE FROM profiles WHERE id = target_user_id;

  -- Delete from auth.users without domain restrictions
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
    -- Log the error but allow the deletion to proceed
    RAISE WARNING 'Error during user deletion: %', SQLERRM;
    -- Attempt direct auth.users deletion as fallback
    DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION delete_user TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_complete TO authenticated;

-- Remove any existing triggers that might interfere with deletion
DROP TRIGGER IF EXISTS prevent_edu_domain_deletion ON auth.users;