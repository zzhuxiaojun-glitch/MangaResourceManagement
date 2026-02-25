/*
  # 更新分类结构为三大类并添加 slug 字段
  
  1. 修改 categories 表
    - 添加 slug 字段用于 URL 路由
    
  2. 数据迁移策略
    - 将旧的子分类（漫画家作品合集、生肉日漫、软件安装包合集）的 titles 迁移到主分类
    - 把旧分类名追加到 titles.tags 中
    - 保留三大主类：漫画、动画、电子书
    - 添加 slug 字段便于路由识别
*/

-- 添加 slug 字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'slug'
  ) THEN
    ALTER TABLE categories ADD COLUMN slug text;
  END IF;
END $$;

-- 获取三大主类的 ID
DO $$
DECLARE
  manga_id uuid;
  anime_id uuid;
  books_id uuid;
  old_category record;
BEGIN
  -- 找到或创建三大主类
  SELECT id INTO manga_id FROM categories WHERE name = '漫画资源';
  SELECT id INTO anime_id FROM categories WHERE name = '动画资源';
  SELECT id INTO books_id FROM categories WHERE name = '电子书';
  
  -- 更新三大主类的 slug 和排序
  IF manga_id IS NOT NULL THEN
    UPDATE categories SET slug = 'manga', sort_order = 1 WHERE id = manga_id;
  END IF;
  
  IF anime_id IS NOT NULL THEN
    UPDATE categories SET slug = 'anime', sort_order = 2 WHERE id = anime_id;
  END IF;
  
  IF books_id IS NOT NULL THEN
    UPDATE categories SET slug = 'books', sort_order = 3 WHERE id = books_id;
  END IF;
  
  -- 迁移旧分类的 titles 到漫画类
  FOR old_category IN 
    SELECT id, name FROM categories 
    WHERE name IN ('漫画家作品合集', '生肉日漫', '软件安装包合集')
  LOOP
    -- 更新 titles：追加旧分类名到 tags，并改到漫画类
    UPDATE titles 
    SET 
      category_id = manga_id,
      tags = CASE 
        WHEN tags = '' OR tags IS NULL THEN old_category.name
        ELSE tags || ',' || old_category.name
      END,
      updated_at = now()
    WHERE category_id = old_category.id;
  END LOOP;
  
  -- 删除旧分类
  DELETE FROM categories WHERE name IN ('漫画家作品合集', '生肉日漫', '软件安装包合集');
END $$;

-- 重命名"漫画资源"为"漫画"，"动画资源"为"动画"
UPDATE categories SET name = '漫画' WHERE name = '漫画资源';
UPDATE categories SET name = '动画' WHERE name = '动画资源';

-- 确保 slug 有唯一约束
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug) WHERE slug IS NOT NULL;