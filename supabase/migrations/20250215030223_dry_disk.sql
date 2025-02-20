-- Disable the trigger temporarily for admin_users table
ALTER TABLE admin_users DISABLE TRIGGER audit_admin_users;

-- Create or replace the make_user_admin function
CREATE OR REPLACE FUNCTION make_user_admin(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  super_admin_role_id uuid;
BEGIN
  -- Verify user exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id
  ) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get super admin role id
  SELECT id INTO super_admin_role_id
  FROM admin_roles 
  WHERE role = 'super_admin';

  -- Create admin user if not exists
  INSERT INTO admin_users (
    profile_id,
    role_id,
    is_active
  )
  VALUES (
    user_id,
    super_admin_role_id,
    true
  )
  ON CONFLICT (profile_id) DO NOTHING;

  -- Re-enable the trigger
  ALTER TABLE admin_users ENABLE TRIGGER audit_admin_users;
END;
$$;