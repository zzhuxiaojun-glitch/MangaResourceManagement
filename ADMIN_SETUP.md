# 管理员账户设置指南

## ⚠️ 重要：首先创建 admins 表

如果执行 SQL 时出现错误 "relation 'admins' does not exist"，说明 `admins` 表还未创建。

**请先在 Supabase SQL Editor 中执行以下 SQL：**

```sql
-- 创建 admins 表
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 启用行级安全
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 创建策略：任何人都可以查询管理员状态
DROP POLICY IF EXISTS "Anyone can check admin status" ON admins;
CREATE POLICY "Anyone can check admin status"
  ON admins
  FOR SELECT
  TO public
  USING (true);
```

**然后添加你的账号为管理员：**

```sql
-- 将你的账号添加为管理员（替换为你的邮箱）
INSERT INTO admins (user_id)
SELECT id FROM auth.users WHERE email = 'zzhuxiaojun@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
```

**验证是否成功：**

```sql
-- 查看所有管理员
SELECT a.id, u.email, a.created_at
FROM admins a
JOIN auth.users u ON a.user_id = u.id;
```

---

## 问题诊断

如果您无法登录管理后台，可能是以下原因：

### 1. 邮箱未确认

Supabase 默认要求用户确认邮箱后才能登录。

**解决方案：**

在 Supabase Dashboard 中：
1. 进入 **Authentication** > **Users**
2. 找到您创建的用户
3. 点击用户进入详情页面
4. 确认 **Email Confirmed At** 字段有值
5. 如果没有值，需要手动确认：
   - 方案A：在用户详情页点击 **Send Magic Link** 或 **Reset Password**
   - 方案B：直接在数据库中更新（见下方 SQL）

**SQL 手动确认邮箱：**

```sql
-- 在 Supabase SQL Editor 中执行
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'zzhuxiaojun@gmail.com';
```

### 2. 禁用邮箱确认（推荐用于管理系统）

如果您的系统只有管理员使用，可以关闭邮箱确认功能：

在 Supabase Dashboard 中：
1. 进入 **Authentication** > **Providers** > **Email**
2. 找到 **Confirm email** 设置
3. 关闭 **Enable email confirmations**
4. 保存设置

这样新创建的用户就可以直接登录了。

### 3. 密码问题

确保您设置的密码：
- 至少 6 个字符
- 记住您设置的实际密码（不是加密后的）

### 4. 环境变量检查

确认 `.env` 文件中的 Supabase 配置正确：

```
NEXT_PUBLIC_SUPABASE_URL=https://oelqkqmaqtpmbbkbyyqu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 推荐的管理员创建流程

### 方法 1：使用 Supabase Dashboard（推荐）

1. 进入 Supabase Dashboard
2. **Authentication** > **Users** > **Add User**
3. 输入邮箱和密码
4. **关闭** "Send Email Confirmation"（如果有这个选项）
5. 创建后，立即运行上面的 SQL 确认邮箱

### 方法 2：使用 SQL 直接创建

```sql
-- 注意：需要使用加密后的密码
-- 可以先在 Dashboard 创建一个临时用户来获取密码格式

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('your_password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  ''
);
```

## 测试登录

完成上述步骤后：

1. 访问：https://manga-resource-manag-v066.bolt.host/admin/login
2. 输入邮箱：`zzhuxiaojun@gmail.com`
3. 输入您设置的密码
4. 点击登录

## 当前配置

- 邮箱：`zzhuxiaojun@gmail.com`
- Supabase 项目：`oelqkqmaqtpmbbkbyyqu`

## 故障排查

如果仍然无法登录：

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 尝试登录
4. 查看是否有错误信息
5. 错误信息会显示具体原因（如 "Email not confirmed", "Invalid credentials" 等）

## 需要帮助？

如果按照上述步骤仍无法解决，请提供：
- 浏览器控制台的错误信息
- Supabase 用户列表的截图（确认 Email Confirmed At 字段）
