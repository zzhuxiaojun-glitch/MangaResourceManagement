'use client';

import Link from 'next/link';
import { Search, LayoutDashboard, LogOut, BookOpen, Video, Book, MessageSquare, LogIn, UserPlus, User, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export function Navbar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const { data } = await supabase
          .from('admins')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        setIsAdmin(!!data);
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navLinks = [
    { href: '/manga', label: '漫画', icon: BookOpen },
    { href: '/anime', label: '动画', icon: Video },
    { href: '/books', label: '电子书', icon: Book },
    { href: '/platforms', label: '网站汇总', icon: Globe },
    { href: '/messages', label: '留言板', icon: MessageSquare },
  ];

  const maintainers = [
    { name: '培风与植土', url: '' },
  ];

  return (
    <div className="flex h-screen">
      <aside className={`bg-white border-r flex flex-col fixed left-0 top-0 h-full z-20 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-6 border-b flex items-center justify-between">
          {!collapsed && (
            <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-gray-600">
              漫画资源库
            </Link>
          )}
          <button
            onClick={onToggle}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${collapsed ? 'mx-auto' : ''}`}
            title={collapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {!collapsed && (
          <div className="p-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="搜索作品、作者、标签..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
          </div>
        )}

        <nav className="flex-1 px-4 py-2">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? link.label : ''}
                >
                  <Icon className="h-5 w-5" />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t mt-auto">
          {!collapsed && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">网站维护者</div>
              {maintainers.map((maintainer, index) => (
                <div key={index}>
                  {maintainer.url ? (
                    <a
                      href={maintainer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {maintainer.name}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-gray-600">
                      {maintainer.name}
                    </span>
                  )}
                </div>
              ))}
              <div className="text-xs text-gray-400 mt-1">
                点击维护者id，可查看维护者个人主页~
              </div>
            </div>
          )}

          {user ? (
            <div className="space-y-2">
              {!collapsed && (
                <div className="flex items-center gap-2 px-2 py-1 mb-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600 truncate">{user.email}</span>
                </div>
              )}
              {isAdmin && (
                <Link href="/admin" className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full ${collapsed ? 'justify-center px-2' : 'justify-start'}`}
                    title={collapsed ? '后台管理' : ''}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && <span className="ml-2">后台管理</span>}
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className={`w-full ${collapsed ? 'justify-center px-2' : 'justify-start'}`}
                title={collapsed ? '退出登录' : ''}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span className="ml-2">退出登录</span>}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link href="/login" className="block">
                <Button
                  variant="outline"
                  size="sm"
                  className={`w-full ${collapsed ? 'justify-center px-2' : 'justify-start'}`}
                  title={collapsed ? '登录' : ''}
                >
                  <LogIn className="h-4 w-4" />
                  {!collapsed && <span className="ml-2">登录</span>}
                </Button>
              </Link>
              <Link href="/register" className="block">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full ${collapsed ? 'justify-center px-2' : 'justify-start'}`}
                  title={collapsed ? '注册' : ''}
                >
                  <UserPlus className="h-4 w-4" />
                  {!collapsed && <span className="ml-2">注册</span>}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
