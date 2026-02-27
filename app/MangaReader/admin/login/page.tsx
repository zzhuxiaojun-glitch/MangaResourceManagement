/**
 * 真实的管理员登录页面
 *
 * 说明：为了安全考虑，将真实的后台登录路径设置为非常规路径
 * 这样可以隐藏真实的后台入口，防止恶意访问
 * 原来的 /admin/login 会自动重定向到此页面
 *
 * 路径配置：统一使用 lib/constants.ts 中的 ADMIN_BASE_PATH
 * 如需修改后台路径，只需更改 ADMIN_BASE_PATH 常量即可
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ADMIN_BASE_PATH } from '@/lib/constants';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast({
        title: '登录成功',
        description: '欢迎回来！',
      });
      router.push('/admin');
    } catch (error: any) {
      console.error('Login error:', error);

      let errorMessage = '邮箱或密码错误';

      if (error.message) {
        if (error.message.includes('Email not confirmed')) {
          errorMessage = '邮箱未确认。请前往 Supabase 后台确认用户邮箱。';
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = '邮箱或密码错误，请检查输入';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: '登录失败',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">管理员登录</CardTitle>
          <CardDescription className="text-center">
            输入您的邮箱和密码以访问管理后台
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              没有账号？{' '}
              <Link
                href={`${ADMIN_BASE_PATH}/register`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                立即注册
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            开发期配置：当前允许公开注册
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
