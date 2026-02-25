'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminNav } from '@/components/admin-nav';
import { ProtectedRoute } from '@/lib/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle2, XCircle, AlertCircle, Plus, Upload } from 'lucide-react';
import Link from 'next/link';

function DashboardContent() {
  const [stats, setStats] = useState({
    totalTitles: 0,
    activeResources: 0,
    inactiveResources: 0,
    pendingTitles: 0,
  });
  const [recentTitles, setRecentTitles] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { data: titles } = await supabase.from('titles').select('*');

    const { data: resources } = await supabase.from('resources').select('*');

    const { data: recent } = await supabase
      .from('titles')
      .select('*, categories(*)')
      .order('created_at', { ascending: false })
      .limit(5);

    setStats({
      totalTitles: titles?.length || 0,
      activeResources: resources?.filter(r => r.is_active).length || 0,
      inactiveResources: resources?.filter(r => !r.is_active).length || 0,
      pendingTitles: titles?.filter(t => t.status === '待补').length || 0,
    });

    setRecentTitles(recent || []);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">仪表盘</h1>
          <div className="flex gap-3">
            <Link href="/admin/titles/new">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                添加资源
              </Button>
            </Link>
            <Link href="/admin/import">
              <Button size="lg" variant="outline">
                <Upload className="h-5 w-5 mr-2" />
                批量导入
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">作品总数</CardTitle>
              <BookOpen className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTitles}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">有效资源</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeResources}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">失效资源</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactiveResources}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待补资源</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTitles}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>最近新增</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTitles.length === 0 ? (
              <div className="text-gray-500 text-center py-4">暂无数据</div>
            ) : (
              <div className="space-y-4">
                {recentTitles.map((title) => (
                  <div
                    key={title.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{title.title}</div>
                      <div className="text-sm text-gray-600">
                        {title.categories.name} · {title.language} · {title.status}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(title.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
