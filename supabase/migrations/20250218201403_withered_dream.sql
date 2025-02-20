/*
  # Email Domain Restriction and Verification

  1. Functions
    - validate_email_domain: Validates @psu.edu and @wm.edu domains
    - handle_new_user: Enforces domain validation and email verification
  
  2. Triggers
    - before_auth_user_create: Validates email domain before user creation
*/

-- Create function to validate email domains
CREATE OR REPLACE FUNCTION validate_email_domain(email text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if email ends with allowed domains
  RETURN email LIKE '%@psu.edu' OR email LIKE '%@wm.edu';
END;
$$;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate email domain
  IF NOT validate_email_domain(NEW.email::text) THEN
    RAISE EXCEPTION 'Invalid email domain. Only @psu.edu and @wm.edu addresses are allowed.';
  END IF;

  -- Set email confirmation requirement
  NEW.email_confirmed_at = null;
  NEW.raw_app_meta_data = jsonb_set(
    coalesce(NEW.raw_app_meta_data, '{}'::jsonb),
    '{email_verification_required}',
    'true'
  );

  RETURN NEW;
END;
$$;

-- Create trigger for new user validation
DROP TRIGGER IF EXISTS before_auth_user_create ON auth.users;
CREATE TRIGGER before_auth_user_create
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();