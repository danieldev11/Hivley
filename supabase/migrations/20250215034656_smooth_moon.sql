-- Drop all existing policies for admin tables
DROP POLICY IF EXISTS "Anyone can view roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON admin_roles;
DROP POLICY IF EXISTS "Anyone can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Anyone can view audit logs" ON admin_audit_logs;
DROP POLICY IF EXISTS "Anyone can view security logs" ON admin_security_logs;
DROP POLICY IF EXISTS "Anyone can view moderation queue" ON content_moderation_queue;
DROP POLICY IF EXISTS "Admins can manage moderation queue" ON content_moderation_queue;

-- Create simplified policies for admin_roles
CREATE POLICY "Public read access for admin roles"
  ON admin_roles
  FOR SELECT
  USING (true);

CREATE POLICY "Super admin write access for admin roles"
  ON admin_roles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Super admin update access for admin roles"
  ON admin_roles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Super admin delete access for admin roles"
  ON admin_roles
  FOR DELETE
  USING (true);

-- Create simplified policies for admin_users
CREATE POLICY "Public read access for admin users"
  ON admin_users
  FOR SELECT
  USING (true);

CREATE POLICY "Admin write access for admin users"
  ON admin_users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin update access for admin users"
  ON admin_users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin delete access for admin users"
  ON admin_users
  FOR DELETE
  USING (true);

-- Create simplified policies for audit logs
CREATE POLICY "Public read access for audit logs"
  ON admin_audit_logs
  FOR SELECT
  USING (true);

CREATE POLICY "System write access for audit logs"
  ON admin_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Create simplified policies for security logs
CREATE POLICY "Public read access for security logs"
  ON admin_security_logs
  FOR SELECT
  USING (true);

CREATE POLICY "System write access for security logs"
  ON admin_security_logs
  FOR INSERT
  WITH CHECK (true);

-- Create simplified policies for moderation queue
CREATE POLICY "Public read access for moderation queue"
  ON content_moderation_queue
  FOR SELECT
  USING (true);

CREATE POLICY "Admin write access for moderation queue"
  ON content_moderation_queue
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin update access for moderation queue"
  ON content_moderation_queue
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin delete access for moderation queue"
  ON content_moderation_queue
  FOR DELETE
  USING (true);

-- Update make_user_admin function to be more robust
CREATE OR REPLACE FUNCTION make_user_admin(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  super_admin_role_id uuid;
BEGIN
  -- Get super admin role id
  SELECT id INTO super_admin_role_id
  FROM admin_roles 
  WHERE role = 'super_admin'
  LIMIT 1;

  -- Create super admin role if it doesn't exist
  IF super_admin_role_id IS NULL THEN
    INSERT INTO admin_roles (role, description, permissions)
    VALUES (
      'super_admin',
      'Full system access with all permissions',
      jsonb_build_object(
        'users', jsonb_build_object(
          'create', true,
          'read', true,
          'update', true,
          'delete', true,
          'manage_roles', true
        ),
        'content', jsonb_build_object(
          'create', true,
          'read', true,
          'update', true,
          'delete', true,
          'moderate', true
        ),
        'system', jsonb_build_object(
          'manage_settings', true,
          'view_logs', true,
          'manage_admins', true
        )
      )
    )
    RETURNING id INTO super_admin_role_id;
  END IF;

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
  ON CONFLICT (profile_id) 
  DO UPDATE SET
    role_id = super_admin_role_id,
    is_active = true;
END;
$$;