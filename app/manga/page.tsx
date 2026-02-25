'use client';

import { useEffect, useState } from 'react';
import { supabase, TitleWithCategory } from '@/lib/supabase';
import { Navbar } from '@/components/navbar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

export default function MangaPage() {
  const [titles, setTitles] = useState<TitleWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const presetTags = ['漫画家作品合集', '生肉日漫', 'BL', 'GL', 'SF', '少年', '少女', '青年'];

  useEffect(() => {
    loadTitles();
  }, []);

  async function loadTitles() {
    setLoading(true);

    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'manga')
      .maybeSingle();

    if (!category) {
      setLoading(false);
      return;
    }

    const { data: titlesData } = await supabase
      .from('titles')
      .select('*, categories(*)')
      .eq('category_id', category.id)
      .order('updated_at', { ascending: false });

    if (titlesData) {
      setTitles(titlesData);

      const tagsSet = new Set<string>();
      titlesData.forEach((title) => {
        if (title.tags) {
          title.tags.split(',').forEach((tag: string) => {
            const trimmed = tag.trim();
            if (trimmed) tagsSet.add(trimmed);
          });
        }
      });

      presetTags.forEach((tag) => tagsSet.add(tag));

      setAvailableTags(Array.from(tagsSet).sort());
    }

    setLoading(false);
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedStatus('all');
    setSearchTerm('');
  };

  const filteredTitles = titles.filter((title) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        title.title.toLowerCase().includes(term) ||
        title.author.toLowerCase().includes(term) ||
        title.tags.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    if (selectedTags.length > 0) {
      const titleTags = title.tags.split(',').map((t) => t.trim());
      const hasTag = selectedTags.some((tag) => titleTags.includes(tag));
      if (!hasTag) return false;
    }

    if (selectedStatus !== 'all' && title.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">漫画资源</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索作品、作者、标签..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border rounded-md"
              >
                <option value="all">全部状态</option>
                <option value="有效">有效</option>
                <option value="失效">失效</option>
                <option value="待补">待补</option>
                <option value="连载中">连载中</option>
                <option value="已完结">已完结</option>
              </select>

              {(selectedTags.length > 0 || selectedStatus !== 'all' || searchTerm) && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  清空筛选
                </Button>
              )}
            </div>

            <div>
              <div className="text-sm font-medium mb-2">标签筛选（可多选）：</div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-blue-100"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          找到 {filteredTitles.length} 个作品
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : filteredTitles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">没有找到相关作品</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTitles.map((title) => (
              <Card key={title.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">
                      <Link href={`/t/${title.id}`} className="hover:text-blue-600">
                        {title.title}
                      </Link>
                    </CardTitle>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
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
                    <p className="text-sm text-gray-600 mb-2">作者：{title.author}</p>
                  )}
                  {title.tags && (
                    <div className="flex flex-wrap gap-1">
                      {title.tags
                        .split(',')
                        .filter((t) => t.trim())
                        .map((tag, idx) => (
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
      </main>
    </div>
  );
}
