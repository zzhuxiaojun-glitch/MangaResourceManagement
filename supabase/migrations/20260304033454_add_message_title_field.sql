/*
  # Add Title Field to Messages Table

  1. Changes
    - Add `title` column to `messages` table
      - Type: text
      - Nullable: false
      - Default: empty string
    
  2. Notes
    - This allows users to give their messages a descriptive title
    - Existing messages will have an empty string as title
*/

-- Add title column to messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'title'
  ) THEN
    ALTER TABLE messages ADD COLUMN title text NOT NULL DEFAULT '';
  END IF;
END $$;