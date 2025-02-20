/*
  # Add Service Reviews Table

  1. New Tables
    - `service_reviews`
      - `id` (uuid, primary key)
      - `service_id` (uuid, references services)
      - `client_id` (uuid, references profiles)
      - `rating` (integer, 1-5)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `service_reviews` table
    - Add policies for:
      - Clients can create reviews for services they've used
      - Everyone can read reviews
      - Clients can update their own reviews
*/

-- Create service_reviews table
CREATE TABLE service_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Ensure one review per client per service
  UNIQUE(service_id, client_id)
);

-- Enable RLS
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can read reviews"
  ON service_reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Clients can create reviews for completed bookings"
  ON service_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.service_id = service_reviews.service_id
      AND bookings.client_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

CREATE POLICY "Clients can update their own reviews"
  ON service_reviews
  FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_service_reviews_updated_at
  BEFORE UPDATE ON service_reviews
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_service_reviews_service_id ON service_reviews(service_id);
CREATE INDEX idx_service_reviews_client_id ON service_reviews(client_id);
CREATE INDEX idx_service_reviews_rating ON service_reviews(rating);