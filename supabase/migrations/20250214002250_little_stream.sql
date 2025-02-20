/*
  # Add Service Images Support (If Not Exists)

  This migration adds support for service images if the table doesn't already exist.
  It also ensures proper indexing and security policies are in place.

  1. Security
    - Ensure RLS is enabled
    - Add policies for managing service images
  
  2. Performance
    - Add indexes for better query performance
*/

-- Only create table if it doesn't exist
DO $$ 
BEGIN
  -- Check if service_images table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'service_images'
  ) THEN
    -- Create service_images table
    CREATE TABLE service_images (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
      url text NOT NULL,
      "order" integer NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Ensure policies exist (will not error if they already do)
DO $$ 
BEGIN
  -- Providers can manage their service images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_images' 
    AND policyname = 'Providers can manage their service images'
  ) THEN
    CREATE POLICY "Providers can manage their service images"
      ON service_images
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM services
        WHERE services.id = service_images.service_id
        AND services.provider_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM services
        WHERE services.id = service_images.service_id
        AND services.provider_id = auth.uid()
      ));
  END IF;

  -- Everyone can view service images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_images' 
    AND policyname = 'Everyone can view service images'
  ) THEN
    CREATE POLICY "Everyone can view service images"
      ON service_images
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'service_images' 
    AND indexname = 'idx_service_images_service_id'
  ) THEN
    CREATE INDEX idx_service_images_service_id ON service_images(service_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'service_images' 
    AND indexname = 'idx_service_images_order'
  ) THEN
    CREATE INDEX idx_service_images_order ON service_images("order");
  END IF;
END $$;