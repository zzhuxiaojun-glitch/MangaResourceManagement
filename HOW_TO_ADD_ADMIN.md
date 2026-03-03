# 如何设置管理员账号

## 判断机制

系统通过查询 `admins` 表来判断用户是否为管理员：
- 如果用户的 `user_id` 存在于 `admins` 表中，则该用户是管理员
- 管理员可以访问后台管理功能
- 普通用户只能访问前台功能

## 添加管理员的方法

### 方法一：使用 Supabase Dashboard（推荐）

1. 登录到 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Table Editor**
4. 找到 `admins` 表
5. 点击 **Insert row**
6. 填写以下信息：
   - `user_id`: 粘贴用户的 UUID（从 `auth.users` 表中获取）
   - 其他字段会自动填充
7. 点击 **Save**

### 方法二：使用 SQL 命令

1. 进入 Supabase Dashboard 的 **SQL Editor**
2. 运行以下 SQL 命令：

```sql
-- 首先，查看所有已注册用户及其 ID
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC;

-- 然后，使用用户的 ID 添加为管理员
-- 将 'USER_ID_HERE' 替换为实际的用户 UUID
INSERT INTO admins (user_id)
VALUES ('USER_ID_HERE');
```

### 方法三：通过邮箱添加管理员

如果你知道用户的邮箱地址，可以直接使用：

```sql
-- 将 'user@example.com' 替换为实际的邮箱地址
INSERT INTO admins (user_id)
SELECT id FROM auth.users WHERE email = 'user@example.com';
```

## 查看当前所有管理员

```sql
SELECT a.id, u.email, a.created_at
FROM admins a
JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC;
```

## 移除管理员权限

```sql
-- 方法1: 通过邮箱移除
DELETE FROM admins
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');

-- 方法2: 直接通过 user_id 移除
DELETE FROM admins WHERE user_id = 'USER_ID_HERE';
```

## 示例：完整流程

假设你刚注册了账号 `admin@example.com`，想要将其设置为管理员：

```sql
-- 步骤1: 查看该用户的 ID
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- 步骤2: 添加为管理员（假设 ID 是 abc123...）
INSERT INTO admins (user_id)
VALUES ('abc123-456-789-abc-def123456789');

-- 或者一步完成：
INSERT INTO admins (user_id)
SELECT id FROM auth.users WHERE email = 'admin@example.com';

-- 步骤3: 验证是否添加成功
SELECT a.id, u.email, a.created_at
FROM admins a
JOIN auth.users u ON a.user_id = u.id
WHERE u.email = 'admin@example.com';
```

## 注意事项

1. 每个用户只能添加一次到 `admins` 表（`user_id` 字段有唯一约束）
2. 如果用户被删除，管理员记录会自动删除（CASCADE 级联删除）
3. 普通用户可以查询 `admins` 表以检查管理员状态，但无法修改
4. 建议至少保留一个管理员账号，避免失去管理权限
