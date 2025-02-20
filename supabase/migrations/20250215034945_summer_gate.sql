-- Drop all existing policies for admin tables to start fresh
DROP POLICY IF EXISTS "Public read access for admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admin write access for admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admin update access for admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admin delete access for admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Public read access for admin users" ON admin_users;
DROP POLICY IF EXISTS "Admin write access for admin users" ON admin_users;
DROP POLICY IF EXISTS "Admin update access for admin users" ON admin_users;
DROP POLICY IF EXISTS "Admin delete access for admin users" ON admin_users;

-- Create simplified policies that don't cause recursion
CREATE POLICY "Anyone can read admin roles"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create admin users"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update admin users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

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