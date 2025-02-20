/*
  # Add service images storage bucket and policies

  1. Storage
    - Create 'services' bucket for storing service images
    - Set up public access policies
  
  2. Security
    - Enable authenticated users to upload images
    - Allow public read access to images
*/

-- Enable storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('services', 'services', true);

-- Allow authenticated users to upload files to the services bucket
CREATE POLICY "Authenticated users can upload service images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'services' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own service images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'services' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'services' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own service images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'services' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to all files in the services bucket
CREATE POLICY "Public read access for service images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'services');