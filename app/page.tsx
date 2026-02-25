'use client';

import { useEffect, useState } from 'react';
import { supabase, Category, TitleWithCategory } from '@/lib/supabase';
import { Navbar } from '@/components/navbar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { Folder, Clock } from 'lucide-react';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentTitles, setRecentTitles] = useState<TitleWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search');

  useEffect(() => {
    loadData();
  }, [searchTerm]);

  async function loadData() {
    setLoading(true);

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    let query = supabase
      .from('titles')
      .select('*, categories(*)')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,alt_titles.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,tags.ilike.%${searchTerm}%`);
    }

    const { data: titlesData } = await query;

    setCategories(categoriesData || []);
    setRecentTitles(titlesData || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {searchTerm && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold">搜索结果：{searchTerm}</h2>
            <p className="text-gray-600 mt-1">找到 {recentTitles.length} 个结果</p>
          </div>
        )}

        {!searchTerm && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Folder className="h-6 w-6" />
              分类浏览
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/c/${category.id}`}
                  className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-center border border-gray-200"
                >
                  <div className="text-lg font-semibold text-gray-800">
                    {category.name}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Clock className="h-6 w-6" />
            {searchTerm ? '搜索结果' : '最近更新'}
          </h2>

          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : recentTitles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? '没有找到相关资源' : '暂无资源'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentTitles.map((title) => (
                <Card key={title.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">
                        <Link href={`/t/${title.id}`} className="hover:text-blue-600">
                          {title.title}
                        </Link>
                      </CardTitle>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {title.categories.name}
                      </Badge>
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
                      <div className="flex flex-wrap gap-1">
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
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {title.summary}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
