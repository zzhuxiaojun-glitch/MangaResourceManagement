/**
 * 后台管理布局组件
 *
 * 功能：
 * 1. 为所有 /admin 路径下的页面提供统一的两栏布局
 * 2. 左侧：侧边栏导航 (AdminSidebar)
 * 3. 右侧：页面内容区域
 * 4. 使用 ProtectedRoute 保护所有后台页面
 *
 * 注意：
 * - 此布局会自动应用到 /admin 下的所有页面
 * - 包括 /admin、/admin/titles、/admin/categories、/admin/import 等
 * - /admin/login 不受此布局影响（位于不同路径）
 */

import { ProtectedRoute } from '@/lib/protected-route';
import { AdminSidebar } from '@/components/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-gray-100">
        {/* 左侧导航栏 - 固定宽度 */}
        <aside className="hidden md:block">
          <AdminSidebar />
        </aside>

        {/* 右侧内容区域 - 自适应宽度，可滚动 */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
