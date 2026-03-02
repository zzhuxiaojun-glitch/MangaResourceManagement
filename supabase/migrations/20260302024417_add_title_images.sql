/*
  # Add Title Images Support

  1. Changes
    - Add `cover_image` column to `titles` table for storing the cover image URL
    - Add `preview_images` column to `titles` table for storing up to 10 preview image URLs
  
  2. Details
    - `cover_image` is a single text field (URL to the cover image)
    - `preview_images` is a text array field that can store up to 10 image URLs
    - Both fields are optional (nullable)
    - These will be used for displaying manga covers and preview pages
  
  3. Notes
    - Images will be stored using base64 data URLs or external URLs
    - The frontend will handle image upload and conversion
    - Preview images are limited to 10 to avoid excessive data storage
*/

DO $$
BEGIN
  -- Add cover_image column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'titles' AND column_name = 'cover_image'
  ) THEN
    ALTER TABLE titles ADD COLUMN cover_image text;
  END IF;

  -- Add preview_images column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'titles' AND column_name = 'preview_images'
  ) THEN
    ALTER TABLE titles ADD COLUMN preview_images text[];
  END IF;
END $$;