-- ========================================
-- 管理员设置 - 一键执行脚本
-- ========================================
--
-- 使用说明：
-- 1. 复制此文件的全部内容
-- 2. 在 Supabase Dashboard 的 SQL Editor 中粘贴
-- 3. 将邮箱地址替换为你的实际邮箱
-- 4. 点击 Run 执行
--
-- ========================================

-- 第一步：创建 admins 表
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 第二步：启用行级安全
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 第三步：创建查询策略
DROP POLICY IF EXISTS "Anyone can check admin status" ON admins;
CREATE POLICY "Anyone can check admin status"
  ON admins
  FOR SELECT
  TO public
  USING (true);

-- 第四步：添加管理员
-- ⚠️ 请将下面的邮箱替换为你的实际邮箱地址
INSERT INTO admins (user_id)
SELECT id FROM auth.users WHERE email = 'zzhuxiaojun@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 第五步：验证结果
SELECT
  a.id as admin_id,
  u.email,
  u.email_confirmed_at,
  a.created_at as admin_since
FROM admins a
JOIN auth.users u ON a.user_id = u.id;

-- 完成！如果看到你的邮箱地址出现在结果中，说明设置成功
