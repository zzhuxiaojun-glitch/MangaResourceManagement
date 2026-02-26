-- 快速修复管理员登录问题
-- 在 Supabase SQL Editor 中执行此脚本

-- 确认您的管理员邮箱
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'zzhuxiaojun@gmail.com';

-- 查询确认结果
SELECT
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'zzhuxiaojun@gmail.com';
