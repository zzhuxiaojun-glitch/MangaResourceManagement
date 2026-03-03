/*
  # Update Messages RLS for User Authentication

  1. Updates
    - Drop existing RLS policies on messages table
    - Create new policies that allow:
      - Public to read published messages
      - Authenticated users to create their own messages
      - Users to update/delete only their own messages
      - Admins to manage all messages (via admin app)
  
  2. Security
    - Users can only edit/delete messages they created
    - Non-authenticated users can only read published messages
    - Created_by field is automatically set to the authenticated user's ID
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'messages'
    AND policyname = 'Allow public to read published messages'
  ) THEN
    DROP POLICY "Allow public to read published messages" ON messages;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'messages'
    AND policyname = 'Allow authenticated users to create messages'
  ) THEN
    DROP POLICY "Allow authenticated users to create messages" ON messages;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'messages'
    AND policyname = 'Allow users to update own messages'
  ) THEN
    DROP POLICY "Allow users to update own messages" ON messages;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'messages'
    AND policyname = 'Allow users to delete own messages'
  ) THEN
    DROP POLICY "Allow users to delete own messages" ON messages;
  END IF;
END $$;

CREATE POLICY "Allow public to read published messages"
  ON messages
  FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Allow authenticated users to create messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow users to update own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow users to delete own messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);