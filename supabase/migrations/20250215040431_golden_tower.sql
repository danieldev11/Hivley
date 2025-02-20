-- Add unique constraint to admin_roles table
ALTER TABLE admin_roles
ADD CONSTRAINT admin_roles_role_key UNIQUE (role);

-- Update make_user_admin function to be simpler and more reliable
CREATE OR REPLACE FUNCTION make_user_admin(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_role_id uuid;
BEGIN
  -- Get or create super admin role
  INSERT INTO admin_roles (role, description, permissions)
  VALUES (
    'super_admin',
    'Full system access with all permissions',
    '{}'::jsonb
  )
  ON CONFLICT (role) DO UPDATE
  SET role = EXCLUDED.role
  RETURNING id INTO super_admin_role_id;

  -- Create or update admin user
  INSERT INTO admin_users (profile_id, role_id, is_active)
  VALUES (user_id, super_admin_role_id, true)
  ON CONFLICT (profile_id) 
  DO UPDATE SET
    role_id = EXCLUDED.role_id,
    is_active = EXCLUDED.is_active;
END;
$$;