'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { ImageCarousel } from '@/components/image-carousel';
import Link from 'next/link';

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

interface PlatformCategory {
  id: string;
  name: string;
  slug: string;
}

export default function PlatformDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [platform, setPlatform] = useState<MangaPlatform | null>(null);
  const [category, setCategory] = useState<PlatformCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlatform();
  }, [params.id]);

  async function loadPlatform() {
    setLoading(true);

    const { data: platformData } = await supabase
      .from('manga_platforms')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (platformData) {
      setPlatform(platformData);

      const { data: categoryData } = await supabase
        .from('platform_categories')
        .select('*')
        .eq('id', platformData.category_id)
        .maybeSingle();

      setCategory(categoryData);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-500">加载中...</div>
        </div>
      </SidebarLayout>
    );
  }

  if (!platform) {
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">平台不存在</p>
            <Link href="/platforms">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回列表
              </Button>
            </Link>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/platforms">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧图片轮播 */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                {platform.images && platform.images.length > 0 ? (
                  <ImageCarousel
                    coverImage={platform.images[0]}
                    previewImages={platform.images.slice(1)}
                    title={platform.name}
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-200 rounded flex items-center justify-center text-gray-400">
                    暂无图片
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧详细信息 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">
                      {platform.name}
                      {platform.japanese_title && (
                        <span className="text-lg text-gray-500 ml-2">
                          ({platform.japanese_title})
                        </span>
                      )}
                    </CardTitle>
                    {category && (
                      <Badge variant="secondary">{category.name}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {platform.publisher && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">发行方</h3>
                    <p className="text-gray-600">{platform.publisher}</p>
                  </div>
                )}

                {platform.platform_type && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">平台类型</h3>
                    <p className="text-gray-600">{platform.platform_type}</p>
                  </div>
                )}

                {platform.representative_works && platform.representative_works.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">代表作品</h3>
                    <div className="flex flex-wrap gap-2">
                      {platform.representative_works.map((work, index) => (
                        <Badge key={index} variant="outline">
                          {work}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {platform.description && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">详细介绍</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {platform.description}
                    </p>
                  </div>
                )}

                {platform.website_url && (
                  <div className="pt-4">
                    <Button
                      onClick={() => window.open(platform.website_url, '_blank')}
                      className="w-full sm:w-auto"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      访问官网
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
