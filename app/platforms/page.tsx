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

interface MangaPlatform {
  id: string;
  category_id: string;
  name: string;
  japanese_title: string;
  description: string;
  publisher: string;
  platform_type: string;
  representative_works: string[];
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryPlatforms.map((platform) => (
                        <PlatformCard key={platform.id} platform={platform} />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
  return (
    <Link href={`/platforms/${platform.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-orange-400">
        <div className="flex gap-3 p-4">
          {/* 左侧图片 */}
          <div className="flex-shrink-0">
            {platform.images && platform.images.length > 0 ? (
              <div className="relative w-24 h-24 bg-gray-200 rounded overflow-hidden">
                <img
                  src={platform.images[0]}
                  alt={platform.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                图片
              </div>
            )}
          </div>

          {/* 右侧内容 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-orange-600 mb-1 truncate">
              {platform.name}
              {platform.japanese_title && (
                <span className="text-sm ml-1">({platform.japanese_title})</span>
              )}
            </h3>

            {platform.publisher && (
              <p className="text-sm text-gray-700 mb-1">
                <span className="font-medium">发行方：</span>
                {platform.publisher}
              </p>
            )}

            {platform.platform_type && (
              <p className="text-sm text-gray-700 mb-1">
                <span className="font-medium">平台：</span>
                {platform.platform_type}
              </p>
            )}

            {platform.representative_works && platform.representative_works.length > 0 && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">代表作品：</span>
                <span className="text-gray-600">
                  {platform.representative_works.slice(0, 3).join('、')}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
