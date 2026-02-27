/**
 * 后台管理侧边栏导航组件
 *
 * 功能：
 * 1. 提供后台管理的主要导航入口
 * 2. 高亮显示当前页面
 * 3. 响应式设计，支持移动端和桌面端
 *
 * 导航项：
 * - 仪表盘：后台首页，显示系统概览
 * - 作品管理：管理所有作品（漫画、动漫、书籍等）
 * - 分类管理：管理分类和标签
 * - 批量导入：批量导入作品数据
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Upload,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

const navItems = [
  {
    title: '仪表盘',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: '作品管理',
    href: '/admin/titles',
    icon: BookOpen,
  },
  {
    title: '分类管理',
    href: '/admin/categories',
    icon: FolderTree,
  },
  {
    title: '批量导入',
    href: '/admin/import',
    icon: Upload,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      {/* Logo 区域 */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800 px-6">
        <h1 className="text-xl font-bold">后台管理系统</h1>
      </div>

      {/* 用户信息 */}
      {user && (
        <div className="border-b border-gray-800 px-6 py-4">
          <p className="text-sm text-gray-400">登录用户</p>
          <p className="mt-1 truncate text-sm font-medium">{user.email}</p>
        </div>
      )}

      {/* 导航菜单 */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* 退出登录 */}
      <div className="border-t border-gray-800 p-4">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          退出登录
        </Button>
      </div>
    </div>
  );
}
