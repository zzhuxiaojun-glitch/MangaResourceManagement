/**
 * 管理员注册页面
 *
 * 注意：这是开发期配置，允许公开注册
 *
 * 生产环境建议：
 * 1. 关闭公开注册，改为邀请制或管理员创建
 * 2. 启用邮箱验证
 * 3. 添加注册审核机制
 * 4. 实施用户角色和权限管理
 *
 * 参考 lib/auth-context.tsx 中的 signUp 方法注释了解更多安全建议
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

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 前端验证
    if (password !== confirmPassword) {
      toast({
        title: '注册失败',
        description: '两次输入的密码不一致',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: '注册失败',
        description: '密码长度至少为 6 个字符',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      toast({
        title: '注册成功',
        description: '账号创建成功，正在跳转...',
      });

      // 注册成功后跳转到管理后台
      // 注意：如果启用了邮箱验证，用户需要先验证邮箱才能登录
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    } catch (error: any) {
      console.error('Register error:', error);

      let errorMessage = '注册失败，请稍后重试';

      if (error.message) {
        if (error.message.includes('User already registered')) {
          errorMessage = '该邮箱已被注册，请直接登录';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = '密码长度至少为 6 个字符';
        } else if (error.message.includes('Signups not allowed')) {
          errorMessage = '当前不允许注册，请联系管理员';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: '注册失败',
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
          <CardTitle className="text-2xl font-bold text-center">创建管理员账号</CardTitle>
          <CardDescription className="text-center">
            输入您的邮箱和密码以创建新账号
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
                placeholder="至少 6 个字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              已有账号？{' '}
              <Link
                href="/MangaReader/admin/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                立即登录
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
