/*
  # Service Management Schema

  1. New Tables
    - services: Core service information
    - service_images: Service image gallery
    - service_prerequisites: Service prerequisites
    - service_requirements: Service requirements
    - service_packages: Service package options

  2. Security
    - Enable RLS on all tables
    - Providers can manage their own services
    - Everyone can view services
*/

-- Create services table
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  duration integer NOT NULL CHECK (duration > 0),
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create service_images table
CREATE TABLE service_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create service_prerequisites table
CREATE TABLE service_prerequisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create service_requirements table
CREATE TABLE service_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create service_packages table
CREATE TABLE service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  duration integer NOT NULL CHECK (duration > 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Create policies for services
CREATE POLICY "Providers can manage their own services"
  ON services
  FOR ALL
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Everyone can view services"
  ON services
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for service_images
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

CREATE POLICY "Everyone can view service images"
  ON service_images
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for service_prerequisites
CREATE POLICY "Providers can manage their service prerequisites"
  ON service_prerequisites
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM services
    WHERE services.id = service_prerequisites.service_id
    AND services.provider_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM services
    WHERE services.id = service_prerequisites.service_id
    AND services.provider_id = auth.uid()
  ));

CREATE POLICY "Everyone can view service prerequisites"
  ON service_prerequisites
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for service_requirements
CREATE POLICY "Providers can manage their service requirements"
  ON service_requirements
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM services
    WHERE services.id = service_requirements.service_id
    AND services.provider_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM services
    WHERE services.id = service_requirements.service_id
    AND services.provider_id = auth.uid()
  ));

CREATE POLICY "Everyone can view service requirements"
  ON service_requirements
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for service_packages
CREATE POLICY "Providers can manage their service packages"
  ON service_packages
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM services
    WHERE services.id = service_packages.service_id
    AND services.provider_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM services
    WHERE services.id = service_packages.service_id
    AND services.provider_id = auth.uid()
  ));

CREATE POLICY "Everyone can view service packages"
  ON service_packages
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for services
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();