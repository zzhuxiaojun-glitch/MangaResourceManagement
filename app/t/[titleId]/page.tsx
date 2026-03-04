'use client';

import { useEffect, useState } from 'react';
import { supabase, TitleWithResources } from '@/lib/supabase';
import { SidebarLayout } from '@/components/sidebar-layout';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TitleDetailPage({ params }: { params: { titleId: string } }) {
  const [title, setTitle] = useState<TitleWithResources | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImagePage, setCurrentImagePage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [params.titleId]);

  async function loadData() {
    setLoading(true);

    const { data } = await supabase
      .from('titles')
      .select('*, categories(*), resources(*)')
      .eq('id', params.titleId)
      .maybeSingle();

    setTitle(data);
    setLoading(false);
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '已复制',
      description: `${label}已复制到剪贴板`,
    });
  };

  const getAllImages = () => {
    if (!title) return [];
    const images: string[] = [];
    if (title.cover_image) {
      images.push(title.cover_image);
    }
    if (title.preview_images && Array.isArray(title.preview_images)) {
      images.push(...title.preview_images);
    }
    return images;
  };

  const getCurrentPageImages = () => {
    const allImages = getAllImages();
    const startIndex = currentImagePage * 5;
    return allImages.slice(startIndex, startIndex + 5);
  };

  const getTotalPages = () => {
    const allImages = getAllImages();
    return Math.ceil(allImages.length / 5);
  };

  const canGoPrevious = () => currentImagePage > 0;
  const canGoNext = () => currentImagePage < getTotalPages() - 1;

  const openLightbox = (imageIndex: number) => {
    setLightboxImageIndex(imageIndex);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPreviousImage = () => {
    if (lightboxImageIndex > 0) {
      setLightboxImageIndex(lightboxImageIndex - 1);
    }
  };

  const goToNextImage = () => {
    const allImages = getAllImages();
    if (lightboxImageIndex < allImages.length - 1) {
      setLightboxImageIndex(lightboxImageIndex + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;

      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        goToPreviousImage();
      } else if (e.key === 'ArrowRight') {
        goToNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxImageIndex]);

  if (loading) {
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8 text-center">加载中...</div>
      </SidebarLayout>
    );
  }

  if (!title) {
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8 text-center">资源不存在</div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={closeLightbox}
          >
            <X className="h-8 w-8" />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              goToPreviousImage();
            }}
            disabled={lightboxImageIndex === 0}
          >
            <ChevronLeft className="h-12 w-12" />
          </button>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              goToNextImage();
            }}
            disabled={lightboxImageIndex === getAllImages().length - 1}
          >
            <ChevronRight className="h-12 w-12" />
          </button>

          <div
            className="max-w-7xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getAllImages()[lightboxImageIndex]}
              alt={`${title.title} - 图 ${lightboxImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded">
            {lightboxImageIndex + 1} / {getAllImages().length}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="mb-4">
            <Link
              href={`/c/${title.category_id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              ← 返回 {title.categories.name}
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-4">{title.title}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="secondary">{title.categories.name}</Badge>
            {title.language && <Badge variant="outline">{title.language}</Badge>}
            <Badge variant={title.status === '有效' ? 'default' : 'destructive'}>
              {title.status}
            </Badge>
          </div>

          {getAllImages().length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <div className="grid grid-cols-5 gap-2">
                  {getCurrentPageImages().map((image, idx) => {
                    const absoluteIndex = currentImagePage * 5 + idx;
                    return (
                      <div
                        key={idx}
                        className="aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => openLightbox(absoluteIndex)}
                      >
                        <img
                          src={image}
                          alt={`${title.title} - 图 ${absoluteIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    );
                  })}
                </div>

                {getTotalPages() > 1 && (
                  <div className="flex items-center justify-between mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentImagePage(currentImagePage - 1)}
                      disabled={!canGoPrevious()}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      上一页
                    </Button>

                    <span className="text-sm text-gray-600">
                      第 {currentImagePage + 1} / {getTotalPages()} 页
                      （共 {getAllImages().length} 张图片）
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentImagePage(currentImagePage + 1)}
                      disabled={!canGoNext()}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3 text-gray-700">
            {title.author && (
              <div>
                <span className="font-semibold">作者：</span>
                {title.author}
              </div>
            )}

            {title.alt_titles && (
              <div>
                <span className="font-semibold">别名：</span>
                {title.alt_titles}
              </div>
            )}

            {title.tags && (
              <div>
                <span className="font-semibold">标签：</span>
                <div className="inline-flex flex-wrap gap-1 ml-2">
                  {title.tags.split(',').filter(t => t.trim()).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-gray-100 rounded"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {title.summary && (
              <div>
                <span className="font-semibold">简介：</span>
                <p className="mt-2 text-gray-600">{title.summary}</p>
              </div>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>资源链接</CardTitle>
          </CardHeader>
          <CardContent>
            {title.resources.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无资源链接</div>
            ) : (
              <div className="space-y-4">
                {title.resources.map((resource) => (
                  <div
                    key={resource.id}
                    className={`p-4 border rounded-lg ${
                      resource.is_active ? 'bg-white' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{resource.provider}</Badge>
                        {resource.is_active ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">链接：</span>
                        <code className="flex-1 text-xs bg-gray-100 px-2 py-1 rounded break-all">
                          {resource.url}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(resource.url, '链接')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(resource.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>

                      {resource.extract_code && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">提取码：</span>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {resource.extract_code}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(resource.extract_code, '提取码')
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {resource.note && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">备注：</span>
                          {resource.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
