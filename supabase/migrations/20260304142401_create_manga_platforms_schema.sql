/*
  # 创建日本漫画网站汇总数据表

  ## 1. 新建表
    - `platform_categories` - 平台分类表（网站、APP、漫画书店、漫画阅读器、AI漫画翻译·嵌字）
      - `id` (uuid, 主键)
      - `name` (text) - 分类名称
      - `slug` (text) - URL友好标识
      - `sort_order` (integer) - 排序顺序
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `manga_platforms` - 漫画平台信息表
      - `id` (uuid, 主键)
      - `category_id` (uuid, 外键) - 所属分类
      - `name` (text) - 平台名称
      - `description` (text) - 详细介绍
      - `website_url` (text) - 官网链接
      - `images` (text[]) - 图片数组（最多5张）
      - `sort_order` (integer) - 排序顺序
      - `is_active` (boolean) - 是否启用
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## 2. 安全设置
    - 启用 RLS
    - 所有用户可读取已启用的平台信息
    - 仅管理员可以创建、更新、删除

  ## 3. 初始数据
    - 插入5个默认分类
*/

-- 创建平台分类表
CREATE TABLE IF NOT EXISTS platform_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建漫画平台表
CREATE TABLE IF NOT EXISTS manga_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES platform_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  website_url text DEFAULT '',
  images text[] DEFAULT '{}',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_manga_platforms_category ON manga_platforms(category_id);
CREATE INDEX IF NOT EXISTS idx_manga_platforms_active ON manga_platforms(is_active);
CREATE INDEX IF NOT EXISTS idx_platform_categories_slug ON platform_categories(slug);

-- 启用 RLS
ALTER TABLE platform_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE manga_platforms ENABLE ROW LEVEL SECURITY;

-- 平台分类 RLS 策略
CREATE POLICY "Anyone can view platform categories"
  ON platform_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can insert platform categories"
  ON platform_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can update platform categories"
  ON platform_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can delete platform categories"
  ON platform_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

-- 漫画平台 RLS 策略
CREATE POLICY "Anyone can view active manga platforms"
  ON manga_platforms FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can view all manga platforms"
  ON manga_platforms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can insert manga platforms"
  ON manga_platforms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can update manga platforms"
  ON manga_platforms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can delete manga platforms"
  ON manga_platforms FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

-- 插入默认分类
INSERT INTO platform_categories (name, slug, sort_order) VALUES
  ('网站', 'websites', 1),
  ('APP', 'apps', 2),
  ('漫画书店', 'bookstores', 3),
  ('漫画阅读器', 'readers', 4),
  ('AI漫画翻译·嵌字', 'ai-translation', 5)
ON CONFLICT (slug) DO NOTHING;