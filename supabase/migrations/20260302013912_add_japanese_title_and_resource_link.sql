/*
  # Add Japanese Title and Resource Link Fields

  1. Changes
    - Add `japanese_title` column to `titles` table for storing the original Japanese name
    - Add `resource_link` column to `titles` table for storing general resource links
  
  2. Notes
    - Both fields are optional (nullable)
    - These fields complement the existing resource management system
    - `japanese_title` is useful for manga/anime titles
    - `resource_link` provides a quick reference link separate from the detailed resources table
*/

DO $$
BEGIN
  -- Add japanese_title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'titles' AND column_name = 'japanese_title'
  ) THEN
    ALTER TABLE titles ADD COLUMN japanese_title text;
  END IF;

  -- Add resource_link column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'titles' AND column_name = 'resource_link'
  ) THEN
    ALTER TABLE titles ADD COLUMN resource_link text;
  END IF;
END $$;