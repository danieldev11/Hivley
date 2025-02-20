/*
  # Fix service deletion function

  1. Changes
    - Drop existing function to avoid naming conflicts
    - Create new function with proper parameter naming
    - Add proper error handling
    - Add proper transaction handling
*/

-- First drop the existing function
DROP FUNCTION IF EXISTS delete_service_complete(uuid);

-- Create the fixed function
CREATE OR REPLACE FUNCTION delete_service_complete(target_service_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Start transaction
  BEGIN
    -- Delete service images records
    DELETE FROM service_images
    WHERE service_id = target_service_id;

    -- Delete service reviews
    DELETE FROM service_reviews
    WHERE service_id = target_service_id;

    -- Delete service prerequisites
    DELETE FROM service_prerequisites
    WHERE service_id = target_service_id;

    -- Delete service requirements
    DELETE FROM service_requirements
    WHERE service_id = target_service_id;

    -- Delete service packages
    DELETE FROM service_packages
    WHERE service_id = target_service_id;

    -- Delete the service itself
    DELETE FROM services
    WHERE id = target_service_id;

    -- Commit transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback on error
      ROLLBACK;
      RAISE;
  END;
END;
$$;