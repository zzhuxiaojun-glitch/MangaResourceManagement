/*
  # Message Board Feature

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `content` (text) - Message text content
      - `images` (text[]) - Array of image URLs (max 9 images)
      - `referenced_title_id` (uuid, nullable) - FK to titles table if selecting from existing works
      - `custom_work_title` (text, nullable) - Custom work title if not in database
      - `created_at` (timestamptz) - Message creation timestamp
      - `updated_at` (timestamptz) - Message update timestamp
      - `created_by` (uuid) - FK to auth.users (admin who created it)
      - `is_published` (boolean) - Whether message is visible to public
  
  2. Security
    - Enable RLS on `messages` table
    - Authenticated users (admins) can manage all messages
    - Public users can only view published messages
    
  3. Constraints
    - Either referenced_title_id OR custom_work_title can be set, not both
    - Images array limited to 9 items via check constraint
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  images text[] DEFAULT '{}',
  referenced_title_id uuid REFERENCES titles(id) ON DELETE SET NULL,
  custom_work_title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published boolean DEFAULT true,
  CONSTRAINT check_images_limit CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) <= 9),
  CONSTRAINT check_work_reference CHECK (
    (referenced_title_id IS NOT NULL AND custom_work_title IS NULL) OR
    (referenced_title_id IS NULL AND custom_work_title IS NOT NULL) OR
    (referenced_title_id IS NULL AND custom_work_title IS NULL)
  )
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Authenticated users can manage messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public can only view published messages
CREATE POLICY "Public can view published messages"
  ON messages
  FOR SELECT
  TO anon
  USING (is_published = true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_referenced_title ON messages(referenced_title_id);
CREATE INDEX IF NOT EXISTS idx_messages_published ON messages(is_published) WHERE is_published = true;