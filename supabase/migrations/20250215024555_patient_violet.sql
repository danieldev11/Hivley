/*
  # Add Initial Admin Role

  1. Changes
    - Adds initial super admin role if not exists
    - Creates function to make a user an admin

  2. Security
    - Only creates role if it doesn't exist
    - Provides function to safely promote users to admin
*/

-- Create super admin role if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE role = 'super_admin'
  ) THEN
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
  END IF;
END $$;

-- Create function to promote user to admin
CREATE OR REPLACE FUNCTION make_user_admin(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id
  ) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Create admin user if not exists
  INSERT INTO admin_users (
    profile_id,
    role_id,
    is_active
  )
  SELECT 
    user_id,
    (SELECT id FROM admin_roles WHERE role = 'super_admin'),
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE profile_id = user_id
  );
END;
$$;