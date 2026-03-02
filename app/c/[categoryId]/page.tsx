'use client';

import { useEffect, useState } from 'react';
import { supabase, Category, TitleWithCategory } from '@/lib/supabase';
import { SidebarLayout } from '@/components/sidebar-layout';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink } from 'lucide-react';

export default function CategoryPage({ params }: { params: { categoryId: string } }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [titles, setTitles] = useState<TitleWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [params.categoryId, languageFilter, statusFilter]);

  async function loadData() {
    setLoading(true);

    const { data: categoryData } = await supabase
      .from('categories')
      .select('*')
      .eq('id', params.categoryId)
      .maybeSingle();

    let query = supabase
      .from('titles')
      .select('*, categories(*)')
      .eq('category_id', params.categoryId)
      .order('updated_at', { ascending: false });

    if (languageFilter !== 'all') {
      query = query.eq('language', languageFilter);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: titlesData } = await query;

    setCategory(categoryData);
    setTitles(titlesData || []);
    setLoading(false);
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{category?.name}</h1>

          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">语言</label>
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择语言" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="生肉">生肉</SelectItem>
                  <SelectItem value="熟肉">熟肉</SelectItem>
                  <SelectItem value="中">中文</SelectItem>
                  <SelectItem value="日">日文</SelectItem>
                  <SelectItem value="英">英文</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">状态</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="有效">有效</SelectItem>
                  <SelectItem value="失效">失效</SelectItem>
                  <SelectItem value="待补">待补</SelectItem>
                  <SelectItem value="连载中">连载中</SelectItem>
                  <SelectItem value="已完结">已完结</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : titles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">该分类下暂无资源</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {titles.map((title) => (
              <Card key={title.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">
                    <Link href={`/t/${title.id}`} className="hover:text-blue-600">
                      {title.title}
                    </Link>
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    {title.language && (
                      <Badge variant="outline" className="text-xs">
                        {title.language}
                      </Badge>
                    )}
                    <Badge
                      variant={title.status === '有效' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {title.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {title.author && (
                    <p className="text-sm text-gray-600 mb-2">
                      作者：{title.author}
                    </p>
                  )}
                  {title.tags && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {title.tags.split(',').filter(t => t.trim()).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-gray-100 rounded"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  {title.summary && (
                    <p className="text-sm text-gray-500 mt-2 mb-3 line-clamp-2">
                      {title.summary}
                    </p>
                  )}
                  {title.resource_link && (
                    <div className="mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(title.resource_link, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        访问资源页面
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
