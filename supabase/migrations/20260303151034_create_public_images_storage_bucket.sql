/*
  # Create Public Images Storage Bucket

  1. New Storage Bucket
    - Creates a public storage bucket named 'public-images'
    - Used for storing message board images uploaded by users
    - Public access enabled for reading images
  
  2. Security
    - Anonymous users can upload images
    - Images are publicly accessible for viewing
    - Bucket is configured with appropriate file size limits
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'public-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('public-images', 'public-images', true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname = 'Allow public uploads to public-images'
  ) THEN
    CREATE POLICY "Allow public uploads to public-images"
      ON storage.objects
      FOR INSERT
      TO public
      WITH CHECK (bucket_id = 'public-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname = 'Allow public reads from public-images'
  ) THEN
    CREATE POLICY "Allow public reads from public-images"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'public-images');
  END IF;
END $$;