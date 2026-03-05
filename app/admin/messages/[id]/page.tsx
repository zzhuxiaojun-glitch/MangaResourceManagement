'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload, GripVertical, Image as ImageIcon } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [messageTitle, setMessageTitle] = useState('');
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
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isNew) {
      loadMessage();
    }
  }, [params.id]);

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

      setMessageTitle(data.title || '');
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
    if (!searchQuery.trim()) return;

    setSearching(true);
    setHasSearched(false);

    try {
      const { data, error } = await supabase
        .from('titles')
        .select('id, title, japanese_title, main_type')
        .or(`title.ilike.%${searchQuery}%,japanese_title.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching titles:', error);
      toast({
        title: '搜索失败',
        description: '无法搜索作品，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
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

  async function handleFileUpload(files: FileList | File[]) {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => file.type.startsWith('image/'));

    if (validFiles.length === 0) {
      toast({
        title: '无效文件',
        description: '请选择图片文件',
        variant: 'destructive',
      });
      return;
    }

    if (images.length + validFiles.length > 9) {
      toast({
        title: '图片数量限制',
        description: `最多只能添加9张图片，当前已有${images.length}张`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of validFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `message-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('public-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('public-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setImages([...images, ...uploadedUrls]);

      toast({
        title: '上传成功',
        description: `已上传 ${uploadedUrls.length} 张图片`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: '上传失败',
        description: '图片上传失败，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }

  function handleImageDragStart(index: number) {
    setDraggingIndex(index);
  }

  function handleImageDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();

    if (draggingIndex === null || draggingIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggingIndex];
    newImages.splice(draggingIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setImages(newImages);
    setDraggingIndex(index);
  }

  function handleImageDragEnd() {
    setDraggingIndex(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const messageData: any = {
        title: messageTitle.trim(),
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
                <Label htmlFor="messageTitle">留言标题</Label>
                <Input
                  id="messageTitle"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="为留言起个标题..."
                  required
                />
              </div>

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

                <div className="space-y-3 mt-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={images.length >= 9 || uploading}
                      className="flex-1"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {uploading ? '上传中...' : '本地上传'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileUpload(e.target.files);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      拖拽图片到此处，或点击上方按钮选择文件
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      支持批量上传，最多9张
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={imageInput}
                      onChange={(e) => setImageInput(e.target.value)}
                      placeholder="或输入图片URL"
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
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        已添加 {images.length}/9 张图片（拖动调整顺序）
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {images.map((img, idx) => (
                          <div
                            key={idx}
                            draggable
                            onDragStart={() => handleImageDragStart(idx)}
                            onDragOver={(e) => handleImageDragOver(e, idx)}
                            onDragEnd={handleImageDragEnd}
                            className={`relative group cursor-move ${
                              draggingIndex === idx ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="absolute top-1 left-1 z-10 bg-black/50 rounded p-1">
                              <GripVertical className="h-4 w-4 text-white" />
                            </div>
                            <img
                              src={img}
                              alt={`Image ${idx + 1}`}
                              className="w-full h-24 object-cover rounded"
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
                    </div>
                  )}
                </div>
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

                <TabsContent value="existing" className="mt-4 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setHasSearched(false);
                      }}
                      placeholder="输入作品标题（中文或日文）..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          searchTitles();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={searchTitles}
                      disabled={!searchQuery.trim() || searching}
                    >
                      {searching ? '搜索中...' : '搜索'}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500">
                    搜索条件：按作品的<strong>中文标题</strong>或<strong>日文标题</strong>进行模糊匹配（支持部分匹配）
                  </p>

                  {selectedTitle && (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-blue-900">已选择：{selectedTitle.title}</p>
                          {selectedTitle.japanese_title && (
                            <p className="text-sm text-blue-700">{selectedTitle.japanese_title}</p>
                          )}
                          <p className="text-xs text-gray-600 mt-1">{selectedTitle.main_type}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTitle(null);
                            setReferencedTitleId(null);
                            setHasSearched(false);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {!selectedTitle && hasSearched && searchResults.length === 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-center">
                      <p className="text-sm text-yellow-800">
                        未找到匹配的作品「<strong>{searchQuery}</strong>」
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        请尝试其他关键词，或使用"自定义标题"添加本站未收录的作品
                      </p>
                    </div>
                  )}

                  {!selectedTitle && searchResults.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        找到 {searchResults.length} 个结果，点击选择：
                      </p>
                      <div className="border rounded max-h-64 overflow-y-auto">
                        {searchResults.map((title) => (
                          <button
                            key={title.id}
                            type="button"
                            className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                            onClick={() => {
                              setSelectedTitle(title);
                              setReferencedTitleId(title.id);
                              setSearchQuery('');
                              setSearchResults([]);
                              setHasSearched(false);
                            }}
                          >
                            <p className="font-medium text-gray-900">{title.title}</p>
                            {title.japanese_title && (
                              <p className="text-sm text-gray-600">{title.japanese_title}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">{title.main_type}</p>
                          </button>
                        ))}
                      </div>
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
