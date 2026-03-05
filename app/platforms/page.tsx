'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PlatformCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

interface RepresentativeWork {
  name: string;
  url: string;
}

interface MangaPlatform {
  id: string;
  category_id: string;
  name: string;
  japanese_title: string;
  description: string;
  publisher: string;
  publisher_url: string;
  platform_type: string;
  representative_works: string[];
  representative_work_links: RepresentativeWork[];
  website_url: string;
  images: string[];
  sort_order: number;
  is_active: boolean;
}

export default function PlatformsPage() {
  const [categories, setCategories] = useState<PlatformCategory[]>([]);
  const [platforms, setPlatforms] = useState<MangaPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: categoriesData } = await supabase
      .from('platform_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    const { data: platformsData } = await supabase
      .from('manga_platforms')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    setCategories(categoriesData || []);
    setPlatforms(platformsData || []);
    setLoading(false);
  }

  const filteredPlatforms = selectedCategory === 'all'
    ? platforms
    : platforms.filter(p => p.category_id === selectedCategory);

  const getPlatformsByCategory = (categoryId: string) => {
    return platforms.filter(p => p.category_id === categoryId);
  };

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">日本漫画网站汇总</h1>
          <p className="text-gray-600">精选日本漫画相关网站、APP、书店及工具</p>
        </div>

        {/* 分类筛选 */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
          >
            全部
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
              <Badge variant="secondary" className="ml-2">
                {getPlatformsByCategory(category.id).length}
              </Badge>
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : (
          <div className="space-y-12">
            {selectedCategory === 'all' ? (
              categories.map((category) => {
                const categoryPlatforms = getPlatformsByCategory(category.id);
                if (categoryPlatforms.length === 0) return null;

                return (
                  <div key={category.id}>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-2">{category.name}</h2>
                      <div className="h-1 w-20 bg-blue-600 rounded"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {categoryPlatforms.map((platform) => (
                        <PlatformCard key={platform.id} platform={platform} />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPlatforms.map((platform) => (
                  <PlatformCard key={platform.id} platform={platform} />
                ))}
              </div>
            )}

            {filteredPlatforms.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                该分类暂无平台信息
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

function PlatformCard({ platform }: { platform: MangaPlatform }) {
  const handlePublisherClick = (e: React.MouseEvent) => {
    if (platform.publisher_url) {
      e.preventDefault();
      e.stopPropagation();
      window.open(platform.publisher_url, '_blank');
    }
  };

  const handleWorkClick = (e: React.MouseEvent, url: string) => {
    if (url) {
      e.preventDefault();
      e.stopPropagation();
      window.open(url, '_blank');
    }
  };

  const works = platform.representative_work_links || [];

  return (
    <Link href={`/platforms/${platform.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <div className="p-3">
          {/* 图片 */}
          <div className="mb-3">
            {platform.images && platform.images.length > 0 ? (
              <div className="relative w-full h-40 bg-gray-200 rounded overflow-hidden">
                <img
                  src={platform.images[0]}
                  alt={platform.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-40 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                图片
              </div>
            )}
          </div>

          {/* 网站名称 */}
          <div className="mb-2">
            <h3 className="font-bold text-blue-600 text-base leading-tight mb-0.5">
              {platform.name}
            </h3>
            {platform.japanese_title && (
              <p className="text-xs text-gray-500 leading-tight">
                {platform.japanese_title}
              </p>
            )}
          </div>

          {/* 其他信息 */}
          <div className="space-y-1.5">
            {platform.publisher && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600">发行方：</span>
                <Badge
                  variant="secondary"
                  className={`text-xs px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 ${platform.publisher_url ? 'cursor-pointer' : ''}`}
                  onClick={platform.publisher_url ? handlePublisherClick : undefined}
                >
                  {platform.publisher}
                </Badge>
              </div>
            )}

            {platform.platform_type && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600">平台：</span>
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-100 text-green-700">
                  {platform.platform_type}
                </Badge>
              </div>
            )}

            {works.length > 0 && (
              <div>
                <div className="text-xs text-gray-600 mb-1">代表作品：</div>
                <div className="flex flex-col gap-1">
                  {works.slice(0, 3).map((work, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={`text-xs px-2 py-0.5 bg-amber-100 text-amber-700 hover:bg-amber-200 ${work.url ? 'cursor-pointer' : ''} w-fit`}
                      onClick={work.url ? (e) => handleWorkClick(e, work.url) : undefined}
                    >
                      {work.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
