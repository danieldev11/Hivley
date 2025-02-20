/*
  # Add user metadata and preferences

  1. New Tables
    - `user_metadata`
      - `id` (uuid, primary key, references profiles.id)
      - `preferences` (jsonb)
      - `last_login` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_metadata` table
    - Add policies for authenticated users to read/update their own data
*/

CREATE TABLE IF NOT EXISTS user_metadata (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferences jsonb DEFAULT '{}'::jsonb,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own metadata"
  ON user_metadata
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own metadata"
  ON user_metadata
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only"
  ON user_metadata
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_metadata_updated_at
  BEFORE UPDATE ON user_metadata
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();