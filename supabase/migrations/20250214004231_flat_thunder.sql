/*
  # Add search capabilities to services

  1. Changes
    - Add search vector column for full-text search
    - Create indexes for better search performance
    - Add trigger to update search vector on changes

  2. Search Fields
    - Title
    - Description
    - Category
    - Location
*/

-- Create function to generate search vector
CREATE OR REPLACE FUNCTION generate_service_search_vector(
  title text,
  description text,
  category text,
  location text
) RETURNS tsvector AS $$
BEGIN
  RETURN (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'C')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add search vector column
ALTER TABLE services 
ADD COLUMN search_vector tsvector;

-- Update existing rows
UPDATE services 
SET search_vector = generate_service_search_vector(title, description, category, location);

-- Create trigger function to update search vector
CREATE OR REPLACE FUNCTION update_service_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := generate_service_search_vector(
    NEW.title,
    NEW.description,
    NEW.category,
    NEW.location
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER service_search_vector_update
  BEFORE INSERT OR UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_service_search_vector();

-- Create GIN index for full-text search
CREATE INDEX idx_services_search ON services USING GIN (search_vector);

-- Create composite indexes for common filter combinations
CREATE INDEX idx_services_category_status ON services(category, status);
CREATE INDEX idx_services_price_status ON services(price, status);
CREATE INDEX idx_services_created_at_status ON services(created_at DESC, status);