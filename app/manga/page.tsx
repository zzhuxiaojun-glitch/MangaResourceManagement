'use client';

import { useEffect, useState } from 'react';
import { supabase, TitleWithCategory } from '@/lib/supabase';
import { SidebarLayout } from '@/components/sidebar-layout';
import { CategoryFilter } from '@/components/category-filter';
import { ImageCarousel } from '@/components/image-carousel';
import { MANGA_TAGS } from '@/lib/constants';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, ExternalLink } from 'lucide-react';

export default function MangaPage() {
  const [titles, setTitles] = useState<TitleWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

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
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
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

            <CategoryFilter
              label="标签筛选（可多选）"
              categories={[...MANGA_TAGS]}
              selectedCategories={selectedTags}
              onCategoryChange={toggleTag}
              multiSelect={true}
            />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredTitles.map((title) => (
              <Card key={title.id} className="hover:shadow-lg transition-shadow">
                <Link href={`/t/${title.id}`}>
                  <div className="p-4">
                    <ImageCarousel
                      coverImage={title.cover_image}
                      previewImages={title.preview_images}
                      title={title.title}
                    />
                  </div>
                </Link>
                <CardHeader className="pt-0">
                  <div>
                    <CardTitle className="text-base">
                      <Link href={`/t/${title.id}`} className="hover:text-blue-600">
                        {title.title}
                      </Link>
                    </CardTitle>
                    {title.japanese_title && (
                      <p className="text-xs text-gray-500 mt-1">
                        {title.japanese_title}
                      </p>
                    )}
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
                    <div className="flex flex-wrap gap-1 mb-2">
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
