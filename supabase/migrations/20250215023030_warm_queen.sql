/*
  # Admin System Schema

  1. New Tables
    - `admin_roles`: Defines admin role types and permissions
    - `admin_users`: Links profiles to admin roles with additional security info
    - `admin_audit_logs`: Tracks all admin actions
    - `admin_security_logs`: Records security events (login attempts, etc.)
    - `content_moderation_queue`: Manages content requiring moderation
    - `admin_sessions`: Tracks active admin sessions

  2. Security
    - Enable RLS on all tables
    - Strict policies for admin access
    - Audit logging triggers
    - Session management
*/

-- Create enum for admin role types
CREATE TYPE admin_role_type AS ENUM (
  'super_admin',
  'content_moderator',
  'user_manager',
  'support_admin'
);

-- Create enum for audit action types
CREATE TYPE audit_action_type AS ENUM (
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'password_reset',
  'user_suspension',
  'user_ban',
  'content_moderation'
);

-- Create enum for content moderation status
CREATE TYPE moderation_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'flagged'
);

-- Create admin roles table
CREATE TABLE admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role admin_role_type NOT NULL,
  description text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin users table
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES admin_roles(id) NOT NULL,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  failed_login_attempts integer DEFAULT 0,
  lockout_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id)
);

-- Create admin audit logs table
CREATE TABLE admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admin_users(id) NOT NULL,
  action audit_action_type NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  changes jsonb NOT NULL,
  ip_address inet NOT NULL,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create admin security logs table
CREATE TABLE admin_security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admin_users(id),
  event_type text NOT NULL,
  ip_address inet NOT NULL,
  user_agent text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create content moderation queue table
CREATE TABLE content_moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  status moderation_status DEFAULT 'pending',
  reporter_id uuid REFERENCES profiles(id),
  reason text,
  moderator_id uuid REFERENCES admin_users(id),
  moderation_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin sessions table
CREATE TABLE admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admin_users(id) NOT NULL,
  token text NOT NULL UNIQUE,
  ip_address inet NOT NULL,
  user_agent text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_roles
CREATE POLICY "Only super admins can manage roles"
  ON admin_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.profile_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM admin_roles ar
        WHERE ar.id = admin_users.role_id
        AND ar.role = 'super_admin'
      )
    )
  );

CREATE POLICY "Admins can view roles"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.profile_id = auth.uid()
    )
  );

-- Create policies for admin_users
CREATE POLICY "Super admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON ar.id = au.role_id
      WHERE au.profile_id = auth.uid()
      AND ar.role = 'super_admin'
    )
  );

CREATE POLICY "Admins can view own user record"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Create policies for admin_audit_logs
CREATE POLICY "Admins can view audit logs"
  ON admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.profile_id = auth.uid()
    )
  );

CREATE POLICY "System can create audit logs"
  ON admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for admin_security_logs
CREATE POLICY "Only super admins can view security logs"
  ON admin_security_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON ar.id = au.role_id
      WHERE au.profile_id = auth.uid()
      AND ar.role = 'super_admin'
    )
  );

CREATE POLICY "System can create security logs"
  ON admin_security_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for content_moderation_queue
CREATE POLICY "Content moderators can manage moderation queue"
  ON content_moderation_queue
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON ar.id = au.role_id
      WHERE au.profile_id = auth.uid()
      AND (ar.role = 'super_admin' OR ar.role = 'content_moderator')
    )
  );

CREATE POLICY "Users can report content"
  ON content_moderation_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND status = 'pending'
    AND moderator_id IS NULL
  );

-- Create policies for admin_sessions
CREATE POLICY "Admins can manage their own sessions"
  ON admin_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.profile_id = auth.uid()
      AND admin_users.id = admin_sessions.admin_id
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_admin_users_profile_id ON admin_users(profile_id);
CREATE INDEX idx_admin_users_role_id ON admin_users(role_id);
CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_security_logs_admin_id ON admin_security_logs(admin_id);
CREATE INDEX idx_content_moderation_queue_status ON content_moderation_queue(status);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_admin_roles_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION handle_admin_updated_at();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION handle_admin_updated_at();

CREATE TRIGGER update_content_moderation_queue_updated_at
  BEFORE UPDATE ON content_moderation_queue
  FOR EACH ROW
  EXECUTE FUNCTION handle_admin_updated_at();

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id uuid;
  changes jsonb;
BEGIN
  -- Get admin user id
  SELECT id INTO admin_user_id
  FROM admin_users
  WHERE profile_id = auth.uid();

  -- Prepare changes JSON
  IF TG_OP = 'DELETE' THEN
    changes = jsonb_build_object('old_data', row_to_json(OLD));
  ELSIF TG_OP = 'UPDATE' THEN
    changes = jsonb_build_object(
      'old_data', row_to_json(OLD),
      'new_data', row_to_json(NEW)
    );
  ELSE
    changes = jsonb_build_object('new_data', row_to_json(NEW));
  END IF;

  -- Insert audit log
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    table_name,
    record_id,
    changes,
    ip_address,
    user_agent
  )
  VALUES (
    admin_user_id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    changes,
    inet_client_addr(),
    current_setting('request.headers')::json->>'user-agent'
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for relevant tables
CREATE TRIGGER audit_admin_users
  AFTER INSERT OR UPDATE OR DELETE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

CREATE TRIGGER audit_content_moderation
  AFTER INSERT OR UPDATE OR DELETE ON content_moderation_queue
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- Insert default super admin role
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
);