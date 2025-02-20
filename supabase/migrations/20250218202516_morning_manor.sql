-- Create function to clean up unverified users
CREATE OR REPLACE FUNCTION auth.cleanup_unverified_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete unverified users older than 24 hours
  DELETE FROM auth.users
  WHERE email_confirmed_at IS NULL
  AND created_at < now() - interval '24 hours';
END;
$$;

-- Create a scheduled task to clean up unverified users
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
  'cleanup-unverified-users',
  '0 * * * *', -- Run every hour
  $$SELECT auth.cleanup_unverified_users()$$
);

-- Create function to handle profile creation only for verified users
CREATE OR REPLACE FUNCTION auth.handle_verified_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow profile creation for verified users
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = NEW.id
    AND email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot create profile for unverified user';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to enforce profile creation rules
DROP TRIGGER IF EXISTS ensure_verified_user ON public.profiles;
CREATE TRIGGER ensure_verified_user
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_verified_user_profile();

-- Update auth settings
ALTER TABLE auth.users ALTER COLUMN email_confirmed_at DROP NOT NULL;
ALTER TABLE auth.users ADD CONSTRAINT require_email_confirmation 
  CHECK (raw_app_meta_data->>'email_verification_required' = 'true' OR email_confirmed_at IS NOT NULL);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email_confirmed_at ON auth.users(email_confirmed_at)
  WHERE email_confirmed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON auth.users(created_at)
  WHERE email_confirmed_at IS NULL;