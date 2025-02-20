/*
  # Add bookings system

  1. New Tables
    - `bookings`
      - Core booking information
      - Status tracking
      - Payment details
    - `booking_slots`
      - Available time slots for services
    - `provider_availability`
      - Provider's recurring availability
    - `blocked_dates`
      - Dates providers are unavailable
  
  2. Security
    - Enable RLS on all tables
    - Policies for providers and clients
*/

-- Create enum for booking status
CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'completed',
  'cancelled'
);

-- Create bookings table
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  provider_id uuid REFERENCES profiles(id) NOT NULL,
  client_id uuid REFERENCES profiles(id) NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status booking_status DEFAULT 'pending',
  total_price decimal(10,2) NOT NULL,
  special_requirements text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create provider_availability table for recurring availability
CREATE TABLE provider_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create blocked_dates table
CREATE TABLE blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- Policies for bookings
CREATE POLICY "Providers can view their bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (provider_id = auth.uid());

CREATE POLICY "Clients can view their bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Clients can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Providers can update their bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

-- Policies for provider_availability
CREATE POLICY "Providers can manage their availability"
  ON provider_availability
  FOR ALL
  TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Everyone can view provider availability"
  ON provider_availability
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for blocked_dates
CREATE POLICY "Providers can manage their blocked dates"
  ON blocked_dates
  FOR ALL
  TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Everyone can view blocked dates"
  ON blocked_dates
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_provider_availability_updated_at
  BEFORE UPDATE ON provider_availability
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();