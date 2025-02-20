/*
  # Add Status Column to Services Table

  1. Changes
    - Add `status` column to `services` table with type `text`
    - Set default value to 'active'
    - Add check constraint to ensure valid status values
    - Update existing rows to have 'active' status

  2. Security
    - No changes to RLS policies needed as they already handle service access
*/

-- Add status column with default value and constraint
ALTER TABLE services 
ADD COLUMN status text NOT NULL DEFAULT 'active'
CHECK (status IN ('active', 'inactive'));

-- Create index for better query performance
CREATE INDEX idx_services_status ON services(status);