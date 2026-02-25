'use client';

import Link from 'next/link';
import { Search, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export function Navbar() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

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
    { href: '/manga', label: '漫画' },
    { href: '/anime', label: '动画' },
    { href: '/books', label: '电子书' },
  ];

  return (
    <nav className="border-b bg-white sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-gray-600 whitespace-nowrap">
            漫画资源库
          </Link>

          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSearch} className="mb-2">
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

            <div className="flex items-center justify-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                    pathname === link.href ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            {user ? (
              <>
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    后台
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  退出
                </Button>
              </>
            ) : (
              <Link href="/admin/login">
                <Button size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  登录
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
