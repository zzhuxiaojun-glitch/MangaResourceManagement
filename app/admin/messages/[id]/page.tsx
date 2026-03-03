'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Title {
  id: string;
  title: string;
  japanese_title: string | null;
  main_type: string;
}

export default function MessageFormPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const isNew = params.id === 'new';

  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [workSelectionType, setWorkSelectionType] = useState<'existing' | 'custom' | 'none'>('none');
  const [referencedTitleId, setReferencedTitleId] = useState<string | null>(null);
  const [customWorkTitle, setCustomWorkTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Title[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);

  useEffect(() => {
    if (!isNew) {
      loadMessage();
    }
  }, [params.id]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      searchTitles();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  async function loadMessage() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          titles (
            id,
            title,
            japanese_title,
            main_type
          )
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;

      setContent(data.content || '');
      setImages(data.images || []);
      setIsPublished(data.is_published);

      if (data.referenced_title_id && data.titles) {
        setWorkSelectionType('existing');
        setReferencedTitleId(data.referenced_title_id);
        setSelectedTitle(data.titles as Title);
      } else if (data.custom_work_title) {
        setWorkSelectionType('custom');
        setCustomWorkTitle(data.custom_work_title);
      }
    } catch (error) {
      console.error('Error loading message:', error);
      toast({
        title: '加载失败',
        description: '无法加载留言信息',
        variant: 'destructive',
      });
    }
  }

  async function searchTitles() {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('id, title, japanese_title, main_type')
        .or(`title.ilike.%${searchQuery}%,japanese_title.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching titles:', error);
    }
  }

  function addImage() {
    if (!imageInput.trim()) return;
    if (images.length >= 9) {
      toast({
        title: '图片数量限制',
        description: '最多只能添加9张图片',
        variant: 'destructive',
      });
      return;
    }
    setImages([...images, imageInput.trim()]);
    setImageInput('');
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const messageData: any = {
        content,
        images,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      };

      if (workSelectionType === 'existing' && referencedTitleId) {
        messageData.referenced_title_id = referencedTitleId;
        messageData.custom_work_title = null;
      } else if (workSelectionType === 'custom' && customWorkTitle.trim()) {
        messageData.custom_work_title = customWorkTitle.trim();
        messageData.referenced_title_id = null;
      } else {
        messageData.referenced_title_id = null;
        messageData.custom_work_title = null;
      }

      if (isNew) {
        const { data: userData } = await supabase.auth.getUser();
        messageData.created_by = userData?.user?.id;

        const { error } = await supabase
          .from('messages')
          .insert([messageData]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('messages')
          .update(messageData)
          .eq('id', params.id);

        if (error) throw error;
      }

      toast({
        title: '保存成功',
        description: `留言已${isNew ? '创建' : '更新'}`,
      });

      router.push('/admin/messages');
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: '保存失败',
        description: '无法保存留言',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{isNew ? '新增留言' : '编辑留言'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>留言内容</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="content">文字内容</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="输入留言内容..."
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label>配图（最多9张）</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    placeholder="输入图片URL"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addImage();
                      }
                    }}
                  />
                  <Button type="button" onClick={addImage} disabled={images.length >= 9}>
                    <Upload className="h-4 w-4 mr-1" />
                    添加
                  </Button>
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>谈及的作品</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={workSelectionType} onValueChange={(v) => setWorkSelectionType(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="none">无</TabsTrigger>
                  <TabsTrigger value="existing">从本站选择</TabsTrigger>
                  <TabsTrigger value="custom">自定义标题</TabsTrigger>
                </TabsList>

                <TabsContent value="none" className="mt-4">
                  <p className="text-sm text-gray-500">此留言不关联任何作品</p>
                </TabsContent>

                <TabsContent value="existing" className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="search">搜索作品</Label>
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索漫画、动画、电子书..."
                    />
                  </div>

                  {selectedTitle && (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{selectedTitle.title}</p>
                          {selectedTitle.japanese_title && (
                            <p className="text-sm text-gray-600">{selectedTitle.japanese_title}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{selectedTitle.main_type}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTitle(null);
                            setReferencedTitleId(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {searchQuery && searchResults.length > 0 && !selectedTitle && (
                    <div className="border rounded max-h-60 overflow-y-auto">
                      {searchResults.map((title) => (
                        <button
                          key={title.id}
                          type="button"
                          className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                          onClick={() => {
                            setSelectedTitle(title);
                            setReferencedTitleId(title.id);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                        >
                          <p className="font-medium">{title.title}</p>
                          {title.japanese_title && (
                            <p className="text-sm text-gray-600">{title.japanese_title}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{title.main_type}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="custom" className="mt-4">
                  <div>
                    <Label htmlFor="customTitle">自定义作品标题</Label>
                    <Input
                      id="customTitle"
                      value={customWorkTitle}
                      onChange={(e) => setCustomWorkTitle(e.target.value)}
                      placeholder="输入作品名称..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      用于本站尚未收录的作品
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="published">发布状态</Label>
                  <p className="text-sm text-gray-500">关闭后留言将不会在公开页面显示</p>
                </div>
                <Switch
                  id="published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/messages')}
            >
              取消
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
