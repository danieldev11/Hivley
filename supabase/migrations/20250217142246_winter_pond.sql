-- Create a function to handle complete service deletion
CREATE OR REPLACE FUNCTION delete_service_complete(service_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete service images from storage
  -- Note: This is handled by storage triggers

  -- Delete service images records
  DELETE FROM service_images
  WHERE service_id = service_id;

  -- Delete service reviews
  DELETE FROM service_reviews
  WHERE service_id = service_id;

  -- Delete service prerequisites
  DELETE FROM service_prerequisites
  WHERE service_id = service_id;

  -- Delete service requirements
  DELETE FROM service_requirements
  WHERE service_id = service_id;

  -- Delete service packages
  DELETE FROM service_packages
  WHERE service_id = service_id;

  -- Delete the service itself
  DELETE FROM services
  WHERE id = service_id;
END;
$$;