/**
 * 重定向页面
 *
 * 说明：为了安全考虑，此页面会自动重定向到真实的后台登录路径
 * 真实路径为 /MangaReader/admin/login，以隐藏真实的后台入口
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/MangaReader/admin/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-600">正在跳转...</p>
    </div>
  );
}
