# 更新日志

## 2026-02-27 - 登录路径重构

### 修改内容

为了提高后台安全性，重构了管理员登录路径：

1. **新增真实登录路由**
   - 路径：`/MangaReader/admin/login`
   - 功能：完整的管理员登录功能
   - 文件：`app/MangaReader/admin/login/page.tsx`

2. **原登录页面改为重定向**
   - 路径：`/admin/login`
   - 功能：自动重定向到 `/MangaReader/admin/login`
   - 文件：`app/admin/login/page.tsx`

3. **更新权限保护逻辑**
   - 文件：`lib/protected-route.tsx`
   - 未登录用户现在跳转到 `/MangaReader/admin/login`

### 修改文件列表

```
新增:
  app/MangaReader/admin/login/page.tsx

修改:
  app/admin/login/page.tsx
  lib/protected-route.tsx
```

### 使用说明

- 管理员登录请访问：`/MangaReader/admin/login`
- 旧的 `/admin/login` 会自动跳转到新地址
- 所有权限验证失败后会自动跳转到新登录页面

### 安全说明

此修改隐藏了真实的后台入口路径，可以有效防止：
- 恶意扫描器自动发现后台入口
- 暴力破解攻击
- 未授权访问尝试

### 注意事项

- 不影响现有登录功能
- 不影响已登录用户的使用
- 不修改任何权限逻辑
