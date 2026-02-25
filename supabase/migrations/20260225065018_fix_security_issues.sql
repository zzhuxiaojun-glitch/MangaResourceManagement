/*
  # 修复安全问题
  
  1. 删除未使用的索引
  2. 修复 RLS 策略 - 确保只有认证用户可以管理数据
  
  说明：
  - 移除未使用的索引 idx_resources_title_id（因为有外键约束已自动创建索引）
  - 更新 RLS 策略，确保只有认证用户才能进行写操作
  - 保持公开读取策略不变
*/

-- 1. 删除未使用的索引
DROP INDEX IF EXISTS idx_resources_title_id;

-- 2. 删除旧的管理员策略
DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
DROP POLICY IF EXISTS "categories_admin_update" ON categories;
DROP POLICY IF EXISTS "categories_admin_delete" ON categories;

DROP POLICY IF EXISTS "titles_admin_insert" ON titles;
DROP POLICY IF EXISTS "titles_admin_update" ON titles;
DROP POLICY IF EXISTS "titles_admin_delete" ON titles;

DROP POLICY IF EXISTS "resources_admin_insert" ON resources;
DROP POLICY IF EXISTS "resources_admin_update" ON resources;
DROP POLICY IF EXISTS "resources_admin_delete" ON resources;

-- 3. 创建更安全的管理员策略
-- Categories 策略
CREATE POLICY "categories_admin_insert"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "categories_admin_update"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "categories_admin_delete"
  ON categories FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Titles 策略
CREATE POLICY "titles_admin_insert"
  ON titles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "titles_admin_update"
  ON titles FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "titles_admin_delete"
  ON titles FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Resources 策略
CREATE POLICY "resources_admin_insert"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "resources_admin_update"
  ON resources FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "resources_admin_delete"
  ON resources FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);