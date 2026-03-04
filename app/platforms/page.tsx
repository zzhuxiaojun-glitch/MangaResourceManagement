'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { ImageCarousel } from '@/components/image-carousel';

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
  description: string;
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
              // 显示所有分类
              categories.map((category) => {
                const categoryPlatforms = getPlatformsByCategory(category.id);
                if (categoryPlatforms.length === 0) return null;

                return (
                  <div key={category.id}>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-2">{category.name}</h2>
                      <div className="h-1 w-20 bg-blue-600 rounded"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryPlatforms.map((platform) => (
                        <PlatformCard key={platform.id} platform={platform} />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              // 显示选中的分类
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <Card className="hover:shadow-lg transition-shadow">
      {platform.images && platform.images.length > 0 && (
        <div className="p-4">
          <ImageCarousel
            coverImage={platform.images[0]}
            previewImages={platform.images.slice(1)}
            title={platform.name}
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{platform.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {platform.description && (
          <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">
            {platform.description}
          </p>
        )}
        {platform.website_url && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(platform.website_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            访问官网
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
