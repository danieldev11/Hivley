/*
  # Email Domain Validation for Auth

  1. Functions
    - validate_email_domain: Validates @psu.edu and @wm.edu domains
    - handle_new_user: Enforces domain validation on signup
  
  2. Triggers
    - before_auth_user_create: Validates email domain before user creation
*/

-- Create function to validate email domains
CREATE OR REPLACE FUNCTION auth.validate_email_domain(email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if email ends with allowed domains
  RETURN email LIKE '%@psu.edu' OR email LIKE '%@wm.edu';
END;
$$;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate email domain
  IF NOT auth.validate_email_domain(NEW.email::text) THEN
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_new_user();