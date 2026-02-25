/*
  # Add anime type field for classification
  
  1. Changes
    - Add `anime_type` column to `titles` table
    - Values: 'tv' for TV版, 'movie' for 动画电影·剧场版
    - Nullable to support existing data and non-anime titles
  
  2. Notes
    - This field is only used for anime category
    - Other categories (manga, books) can leave this field NULL
    - Future-proof for additional anime classifications
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'titles' AND column_name = 'anime_type'
  ) THEN
    ALTER TABLE titles ADD COLUMN anime_type text CHECK (anime_type IN ('tv', 'movie'));
    
    CREATE INDEX IF NOT EXISTS idx_titles_anime_type ON titles(anime_type);
  END IF;
END $$;
