/*
  # 为漫画平台表添加链接字段

  ## 1. 新增字段
    - `publisher_url` (text) - 发行方链接
    - `representative_work_links` (jsonb) - 代表作品链接，格式：[{name: "作品名", url: "链接"}]
  
  ## 2. 说明
    - publisher_url 用于存储发行方的官网链接
    - representative_work_links 以JSON格式存储作品名称和对应链接
    - 点击标签时可以跳转到相应链接
*/

-- 添加新字段到 manga_platforms 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manga_platforms' AND column_name = 'publisher_url'
  ) THEN
    ALTER TABLE manga_platforms ADD COLUMN publisher_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manga_platforms' AND column_name = 'representative_work_links'
  ) THEN
    ALTER TABLE manga_platforms ADD COLUMN representative_work_links jsonb DEFAULT '[]';
  END IF;
END $$;