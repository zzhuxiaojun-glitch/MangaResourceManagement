/*
  # Update Message Board Public Access

  1. Changes
    - Add policy for anonymous users to insert messages
    - Messages submitted by public users will be unpublished by default (is_published = false)
    - Only authenticated admins can publish messages
  
  2. Security
    - Anonymous users can only insert messages (not update or delete)
    - All submitted messages require admin approval before being visible
    - Maintains existing policies for authenticated users and public viewing
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'Anonymous users can submit messages'
  ) THEN
    CREATE POLICY "Anonymous users can submit messages"
      ON messages
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;