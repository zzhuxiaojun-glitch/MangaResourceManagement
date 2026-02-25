/*
  # 漫画资源管理系统 - 数据库架构
  
  1. 新建表
    - `categories` - 分类管理
      - `id` (uuid, 主键)
      - `name` (text, 唯一, 分类名称)
      - `sort_order` (integer, 排序)
      - `created_at` (timestamptz, 创建时间)
    
    - `titles` - 作品/条目
      - `id` (uuid, 主键)
      - `category_id` (uuid, 外键 -> categories.id)
      - `title` (text, 作品名)
      - `alt_titles` (text, 别名，逗号分隔)
      - `author` (text, 作者)
      - `tags` (text, 标签，逗号分隔)
      - `language` (text, 语言类型)
      - `status` (text, 状态)
      - `summary` (text, 简介)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `resources` - 资源链接
      - `id` (uuid, 主键)
      - `title_id` (uuid, 外键 -> titles.id)
      - `provider` (text, 提供商)
      - `url` (text, 链接地址)
      - `extract_code` (text, 提取码)
      - `note` (text, 备注)
      - `is_active` (boolean, 是否有效)
      - `created_at` (timestamptz)
      
  2. 安全策略
    - 启用所有表的 RLS
    - 公开读取策略：所有人可以查看数据
    - 管理写入策略：只有认证用户可以增删改
*/

-- 创建 categories 表
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 创建 titles 表
CREATE TABLE IF NOT EXISTS titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  alt_titles text DEFAULT '',
  author text DEFAULT '',
  tags text DEFAULT '',
  language text DEFAULT '其他',
  status text DEFAULT '有效',
  summary text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建 resources 表
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid REFERENCES titles(id) ON DELETE CASCADE NOT NULL,
  provider text DEFAULT 'Other',
  url text NOT NULL,
  extract_code text DEFAULT '',
  note text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_titles_category_id ON titles(category_id);
CREATE INDEX IF NOT EXISTS idx_titles_updated_at ON titles(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_title_id ON resources(title_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- 启用 RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Categories 策略
CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "categories_admin_insert"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "categories_admin_update"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "categories_admin_delete"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- Titles 策略
CREATE POLICY "titles_public_read"
  ON titles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "titles_admin_insert"
  ON titles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "titles_admin_update"
  ON titles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "titles_admin_delete"
  ON titles FOR DELETE
  TO authenticated
  USING (true);

-- Resources 策略
CREATE POLICY "resources_public_read"
  ON resources FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "resources_admin_insert"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "resources_admin_update"
  ON resources FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "resources_admin_delete"
  ON resources FOR DELETE
  TO authenticated
  USING (true);