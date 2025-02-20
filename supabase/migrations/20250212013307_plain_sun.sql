/*
  # Fix role constraints for user profiles

  1. Changes
    - Update role check constraint to allow 'provider' and 'client' values
    - Add migration safety checks
  
  2. Security
    - Maintains existing RLS policies
*/

DO $$ 
BEGIN
  -- Update the role check constraint
  ALTER TABLE profiles 
    DROP CONSTRAINT IF EXISTS profiles_role_check;
    
  ALTER TABLE profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('provider', 'client'));
END $$;