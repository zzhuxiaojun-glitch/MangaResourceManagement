/**
 * 重定向页面
 *
 * 说明：为了安全考虑，此页面会自动重定向到真实的后台登录路径
 * 真实路径使用 lib/constants.ts 中的 ADMIN_BASE_PATH 配置
 * 如需修改后台路径，只需更改 ADMIN_BASE_PATH 常量即可
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ADMIN_BASE_PATH } from '@/lib/constants';

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`${ADMIN_BASE_PATH}/login`);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-600">正在跳转...</p>
    </div>
  );
}
