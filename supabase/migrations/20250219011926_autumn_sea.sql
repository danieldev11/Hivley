-- Drop existing email verification triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_email_confirmation ON auth.users;
DROP FUNCTION IF EXISTS auth.handle_new_user();
DROP FUNCTION IF EXISTS auth.handle_email_confirmation();

-- Create function to validate email domains
CREATE OR REPLACE FUNCTION auth.validate_email_domain(email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN email LIKE '%@psu.edu' OR email LIKE '%@wm.edu';
END;
$$;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Validate email domain
  IF NOT auth.validate_email_domain(NEW.email::text) THEN
    RAISE EXCEPTION 'Invalid email domain. Only @psu.edu and @wm.edu addresses are allowed.';
  END IF;

  -- Ensure email verification is required
  NEW.email_confirmed_at = null;
  
  -- Set metadata for verification
  NEW.raw_app_meta_data = jsonb_set(
    jsonb_set(
      coalesce(NEW.raw_app_meta_data, '{}'::jsonb),
      '{email_verification_required}',
      'true'
    ),
    '{profile_creation_blocked}',
    'true'
  );

  -- Set confirmation token if not already set
  IF NEW.confirmation_token IS NULL THEN
    NEW.confirmation_token = encode(gen_random_bytes(32), 'hex');
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for new user verification
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_new_user();

-- Create function to handle email confirmation
CREATE OR REPLACE FUNCTION auth.handle_email_confirmation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Email was just confirmed, allow profile creation
    NEW.raw_app_meta_data = jsonb_set(
      NEW.raw_app_meta_data,
      '{profile_creation_blocked}',
      'false'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for email confirmation
CREATE TRIGGER on_email_confirmation
  BEFORE UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_email_confirmation();

-- Create function to prevent unverified profile creation
CREATE OR REPLACE FUNCTION auth.prevent_unverified_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = NEW.id
    AND (
      email_confirmed_at IS NULL OR
      raw_app_meta_data->>'profile_creation_blocked' = 'true'
    )
  ) THEN
    RAISE EXCEPTION 'Cannot create profile until email is verified';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to prevent unverified profile creation
CREATE TRIGGER ensure_verified_profile
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth.prevent_unverified_profile();

-- Update existing users to require email verification
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{email_verification_required}',
  'true'
)
WHERE raw_app_meta_data->>'email_verification_required' IS NULL;