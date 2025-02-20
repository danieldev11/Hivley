-- Create table for email verification logging
CREATE TABLE IF NOT EXISTS auth.email_verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  verification_token text,
  status text NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE auth.email_verification_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for super admins to view logs
CREATE POLICY "Super admins can view email verification logs"
  ON auth.email_verification_logs
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

-- Create function to log verification attempts
CREATE OR REPLACE FUNCTION auth.log_verification_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO auth.email_verification_logs (
    user_id,
    email,
    verification_token,
    status,
    error_message
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.confirmation_token,
    CASE
      WHEN NEW.email_confirmed_at IS NOT NULL THEN 'verified'
      ELSE 'pending'
    END,
    NULL
  );
  RETURN NEW;
END;
$$;

-- Create trigger for logging verification attempts
CREATE TRIGGER on_verification_attempt
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.log_verification_attempt();