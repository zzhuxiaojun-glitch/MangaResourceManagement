/*
  # 为漫画平台表添加新字段

  ## 1. 新增字段
    - `publisher` (text) - 发行方
    - `platform_type` (text) - 平台类型（网站、APP、网站+APP等）
    - `representative_works` (text[]) - 代表作品（最多3个）
    - `japanese_title` (text) - 日文标题
  
  ## 2. 说明
    - 这些字段用于在列表页展示更详细的平台信息
    - representative_works 以数组形式存储，方便前端展示
*/

-- 添加新字段到 manga_platforms 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manga_platforms' AND column_name = 'publisher'
  ) THEN
    ALTER TABLE manga_platforms ADD COLUMN publisher text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manga_platforms' AND column_name = 'platform_type'
  ) THEN
    ALTER TABLE manga_platforms ADD COLUMN platform_type text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manga_platforms' AND column_name = 'representative_works'
  ) THEN
    ALTER TABLE manga_platforms ADD COLUMN representative_works text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manga_platforms' AND column_name = 'japanese_title'
  ) THEN
    ALTER TABLE manga_platforms ADD COLUMN japanese_title text DEFAULT '';
  END IF;
END $$;