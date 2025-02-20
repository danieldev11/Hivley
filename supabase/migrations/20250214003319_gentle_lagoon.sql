/*
  # Add tags column to services table

  1. Changes
    - Add tags column as a text array to services table
    - Add default empty array value
    - Create index for better query performance with array operations
*/

-- Add tags column with default empty array
ALTER TABLE services 
ADD COLUMN tags text[] NOT NULL DEFAULT '{}';

-- Create GIN index for better array operations performance
CREATE INDEX idx_services_tags ON services USING GIN (tags);