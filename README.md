# 漫画资源库管理系统

一个基于 Next.js + Supabase 的漫画资源管理与分享平台，支持公开浏览和管理员后台管理。

## 功能特性

### 公共功能（无需登录）
- 首页展示最近更新的作品
- 按分类浏览作品
- 搜索作品（支持标题、别名、作者、标签）
- 查看作品详情和资源链接
- 一键复制链接和提取码

### 管理功能（需要登录）
- 仪表盘：查看统计数据和最近新增
- 分类管理：增删改分类
- 作品管理：增删改作品信息
- 资源管理：为作品添加/删除/标记失效资源链接
- CSV 批量导入：批量导入作品和资源
- 一键标记所有资源失效

## 技术栈

- **前端框架**: Next.js 13 + TypeScript
- **UI 组件**: shadcn/ui + Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth

## 快速开始

### 1. 环境变量配置

项目已经配置好了 Supabase，环境变量在 `.env` 文件中：

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. 数据库初始化

数据库已经自动创建了以下表和初始数据：

**表结构：**
- `categories` - 分类表
- `titles` - 作品表
- `resources` - 资源链接表

**初始分类：**
1. 漫画资源
2. 漫画家作品合集
3. 动画资源
4. 软件安装包合集
5. 生肉日漫
6. 电子书

### 3. 创建管理员账户

访问 Supabase Dashboard 创建第一个管理员账户：

1. 进入 Supabase 项目控制台
2. 点击左侧菜单 "Authentication"
3. 点击 "Users" 标签页
4. 点击 "Add user" 按钮
5. 选择 "Create a new user"
6. 输入邮箱和密码
7. 点击 "Create user"

或者使用 SQL：

```sql
-- 在 Supabase SQL Editor 中执行
-- 将 email 和 password 替换为你的邮箱和密码
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('your-password', gen_salt('bf')),
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
);
```

### 4. 启动开发服务器

开发服务器会自动启动，访问 http://localhost:3000

## 使用指南

### 管理员登录

1. 访问 `/admin/login`
2. 输入管理员邮箱和密码
3. 登录成功后会跳转到管理后台

### 分类管理

1. 进入 "分类管理"
2. 点击 "新建分类" 创建新分类
3. 填写分类名称和排序
4. 可以编辑或删除已有分类

### 作品管理

1. 进入 "作品管理"
2. 点击 "新建作品" 创建新作品
3. 填写作品信息（名称、分类、作者、标签、语言、状态等）
4. 保存后可以为作品添加资源链接

### 资源管理

在作品编辑页面：

1. 填写资源信息（提供商、链接、提取码、备注）
2. 点击 "添加资源"
3. 可以标记资源为失效/有效
4. 可以删除资源
5. 可以一键标记该作品的所有资源为失效

### CSV 批量导入

1. 进入 "CSV 导入"
2. 选择目标分类
3. 上传 CSV 文件
4. 点击 "开始导入"

**CSV 格式示例：**

```csv
title,author,tags,language,status,url,extract_code,note
进击的巨人,谏山创,少年,日,已完结,https://pan.baidu.com/s/xxx,abc123,全集
海贼王,尾田荣一郎,少年,日,连载中,https://pan.baidu.com/s/yyy,def456,更新至1000话
```

**支持的列：**
- `title` - 作品名称（必填）
- `author` - 作者
- `tags` - 标签（逗号分隔）
- `language` - 语言（生肉/熟肉/中/日/英/其他）
- `status` - 状态（有效/失效/待补/连载中/已完结）
- `url` - 资源链接
- `extract_code` - 提取码
- `note` - 备注
- `summary` - 简介
- `alt_titles` - 别名（逗号分隔）

**导入逻辑：**
- 如果作品名在该分类下已存在，则更新作品信息并追加资源链接
- 如果作品名不存在，则创建新作品
- 每行至少需要包含 title 列

## 数据库安全

本项目使用 Row Level Security (RLS) 保护数据：

- **公开读取**：所有人可以查看分类、作品和资源
- **管理写入**：只有认证用户（管理员）可以增删改数据

## 部署到生产环境

### 使用 Netlify 部署

1. 将代码推送到 GitHub
2. 在 Netlify 中导入 GitHub 仓库
3. 构建命令：`npm run build`
4. 发布目录：`.next`
5. 添加环境变量（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）
6. 部署

### 使用 Vercel 部署

1. 将代码推送到 GitHub
2. 在 Vercel 中导入 GitHub 仓库
3. 添加环境变量
4. 部署

## 路由说明

### 公共路由
- `/` - 首页
- `/c/[categoryId]` - 分类页面
- `/t/[titleId]` - 作品详情页

### 管理路由（需要登录）
- `/admin` - 管理仪表盘
- `/admin/login` - 登录页面
- `/admin/categories` - 分类管理
- `/admin/titles` - 作品列表
- `/admin/titles/new` - 新建作品
- `/admin/titles/[id]` - 编辑作品
- `/admin/import` - CSV 导入

## 常见问题

### 如何修改默认分类？

直接在数据库中修改 `categories` 表，或通过管理后台的分类管理功能。

### 如何重置管理员密码？

在 Supabase Dashboard 的 Authentication > Users 中找到用户，点击编辑，修改密码。

### 如何备份数据？

在 Supabase Dashboard 中使用 SQL Editor 导出数据，或使用 Supabase CLI 工具。

### 资源链接支持哪些网盘？

支持所有网盘链接，包括：
- 百度网盘
- 阿里云盘
- Mega
- Google Drive
- 其他任何链接

## 开发说明

### 项目结构

```
project/
├── app/                      # Next.js 13 App Router
│   ├── admin/               # 管理后台页面
│   │   ├── categories/      # 分类管理
│   │   ├── titles/          # 作品管理
│   │   ├── import/          # CSV 导入
│   │   └── login/           # 登录页面
│   ├── c/[categoryId]/      # 分类页面
│   ├── t/[titleId]/         # 作品详情页
│   └── page.tsx             # 首页
├── components/              # React 组件
│   ├── ui/                  # shadcn/ui 组件
│   ├── navbar.tsx           # 公共导航栏
│   └── admin-nav.tsx        # 管理后台导航栏
├── lib/                     # 工具函数和配置
│   ├── supabase.ts          # Supabase 客户端
│   ├── auth-context.tsx     # 认证上下文
│   └── protected-route.tsx  # 路由保护
└── README.md                # 项目文档
```

## 许可证

MIT
