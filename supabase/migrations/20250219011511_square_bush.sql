-- Drop existing email verification triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auth.handle_new_user();

-- Create improved email verification handler
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Ensure email verification is required
  NEW.email_confirmed_at = null;
  NEW.raw_app_meta_data = jsonb_set(
    coalesce(NEW.raw_app_meta_data, '{}'::jsonb),
    '{email_verification_required}',
    'true'
  );
  
  -- Set confirmation token if not already set
  IF NEW.confirmation_token IS NULL THEN
    NEW.confirmation_token = encode(gen_random_bytes(32), 'hex');
  END IF;

  -- Prevent profile creation until email is verified
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.raw_app_meta_data = jsonb_set(
      NEW.raw_app_meta_data,
      '{profile_creation_blocked}',
      'true'
    );
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

-- Update existing users to require email verification
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{email_verification_required}',
  'true'
)
WHERE raw_app_meta_data->>'email_verification_required' IS NULL;