-- Drop existing policies
DROP POLICY IF EXISTS "Only super admins can manage roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can view roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view own user record" ON admin_users;

-- Create new policies for admin_roles
CREATE POLICY "Anyone can view roles"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage roles"
  ON admin_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.profile_id = auth.uid()
      AND au.is_active = true
      AND EXISTS (
        SELECT 1 FROM admin_roles ar
        WHERE ar.id = au.role_id
        AND ar.role = 'super_admin'
      )
    )
  )
  WITH CHECK (true);

-- Create new policies for admin_users
CREATE POLICY "Anyone can view admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.profile_id = auth.uid()
      AND au.is_active = true
      AND EXISTS (
        SELECT 1 FROM admin_roles ar
        WHERE ar.id = au.role_id
        AND ar.role = 'super_admin'
      )
    )
  )
  WITH CHECK (true);

-- Create new policy for admin_audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_logs;

CREATE POLICY "Anyone can view audit logs"
  ON admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create new policy for admin_security_logs
DROP POLICY IF EXISTS "Only super admins can view security logs" ON admin_security_logs;

CREATE POLICY "Anyone can view security logs"
  ON admin_security_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create new policy for content_moderation_queue
DROP POLICY IF EXISTS "Content moderators can manage moderation queue" ON content_moderation_queue;

CREATE POLICY "Anyone can view moderation queue"
  ON content_moderation_queue
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage moderation queue"
  ON content_moderation_queue
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.profile_id = auth.uid()
      AND au.is_active = true
    )
  )
  WITH CHECK (true);