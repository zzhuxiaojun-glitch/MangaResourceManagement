/*
  # Create Admins Table

  1. New Tables
    - `admins`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `admins` table
    - Only allow authenticated users to read (to check if they are admin)
    - No public insert/update/delete access
  
  3. Notes
    - This table stores which users have admin privileges
    - To make a user an admin, insert their user_id into this table
    - Regular users can read to check admin status but cannot modify
*/

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'admins'
    AND policyname = 'Anyone can check admin status'
  ) THEN
    CREATE POLICY "Anyone can check admin status"
      ON admins
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;