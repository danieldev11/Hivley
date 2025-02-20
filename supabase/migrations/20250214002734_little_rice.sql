/*
  # Add location column to services table

  1. Changes
    - Add location column to services table
    - Make location column required
    - Add index for better query performance
*/

-- Add location column with NOT NULL constraint
ALTER TABLE services 
ADD COLUMN location text NOT NULL DEFAULT 'Online'
CHECK (length(location) > 0);

-- Create index for better query performance
CREATE INDEX idx_services_location ON services(location);