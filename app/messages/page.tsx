'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload, Plus, Image as ImageIcon, GripVertical, CreditCard as Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { SidebarLayout } from '@/components/sidebar-layout';
import { useAuth } from '@/lib/auth-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ImageViewer } from '@/components/image-viewer';

interface Message {
  id: string;
  title: string;
  content: string;
  images: string[];
  referenced_title_id: string | null;
  custom_work_title: string | null;
  created_at: string;
  created_by: string | null;
  titles?: {
    id: string;
    title: string;
    japanese_title: string | null;
  };
}

interface Title {
  id: string;
  title: string;
  japanese_title: string | null;
  category_id?: string;
  categories?: {
    name: string;
  } | null;
}

export default function MessagesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [messageTitle, setMessageTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [workSelectionType, setWorkSelectionType] = useState<'existing' | 'custom' | 'none'>('none');
  const [referencedTitleId, setReferencedTitleId] = useState<string | null>(null);
  const [customWorkTitle, setCustomWorkTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Title[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          titles (
            id,
            title,
            japanese_title
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function searchTitles() {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setHasSearched(false);

    try {
      const { data, error } = await supabase
        .from('titles')
        .select('id, title, japanese_title, category_id, categories(name)')
        .or(`title.ilike.%${searchQuery}%,japanese_title.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;

      const results: Title[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        japanese_title: item.japanese_title,
        category_id: item.category_id,
        categories: item.categories && !Array.isArray(item.categories)
          ? item.categories
          : null,
      }));

      setSearchResults(results);
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

  function resetForm() {
    setMessageTitle('');
    setContent('');
    setImages([]);
    setImageInput('');
    setWorkSelectionType('none');
    setReferencedTitleId(null);
    setCustomWorkTitle('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedTitle(null);
    setSearching(false);
    setHasSearched(false);
    setShowForm(false);
    setEditingMessageId(null);
  }

  function startEdit(message: Message) {
    setEditingMessageId(message.id);
    setMessageTitle(message.title || '');
    setContent(message.content);
    setImages(message.images || []);

    if (message.referenced_title_id && message.titles) {
      setWorkSelectionType('existing');
      setReferencedTitleId(message.referenced_title_id);
      setSelectedTitle({
        id: message.titles.id,
        title: message.titles.title,
        japanese_title: message.titles.japanese_title,
      });
    } else if (message.custom_work_title) {
      setWorkSelectionType('custom');
      setCustomWorkTitle(message.custom_work_title);
    } else {
      setWorkSelectionType('none');
    }

    setShowForm(true);
  }

  async function handleDelete(messageId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: '删除成功',
        description: '留言已删除',
      });

      await loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: '删除失败',
        description: '无法删除留言，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirmId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const messageData: any = {
        title: messageTitle.trim(),
        content,
        images,
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

      if (editingMessageId) {
        messageData.updated_at = new Date().toISOString();

        const { error } = await supabase
          .from('messages')
          .update(messageData)
          .eq('id', editingMessageId);

        if (error) throw error;

        toast({
          title: '更新成功',
          description: '您的留言已更新',
        });
      } else {
        if (!user) {
          toast({
            title: '请先登录',
            description: '登录后才能发布留言',
            variant: 'destructive',
          });
          return;
        }

        messageData.is_published = false;
        messageData.created_by = user.id;

        const { error } = await supabase
          .from('messages')
          .insert([messageData]);

        if (error) throw error;

        toast({
          title: '提交成功',
          description: '您的留言已提交，待管理员审核后显示',
        });
      }

      resetForm();
      await loadMessages();
    } catch (error) {
      console.error('Error submitting message:', error);
      toast({
        title: editingMessageId ? '更新失败' : '提交失败',
        description: '操作失败，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function openImageViewer(images: string[], index: number) {
    setViewerImages(images);
    setViewerInitialIndex(index);
    setShowViewer(true);
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="p-8">
          <p className="text-center text-gray-500">加载中...</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-6 md:p-8">
        <div className="max-w-4xl">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">留言板</h1>
            <p className="text-gray-600 mt-1">分享与交流</p>
          </div>
          <div className="flex gap-2">
            {!user && (
              <Link href="/login">
                <Button variant="outline">登录</Button>
              </Link>
            )}
            {user && (
              <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
                <Plus className="h-4 w-4 mr-2" />
                {showForm ? '取消' : '发表留言'}
              </Button>
            )}
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-semibold">
                {editingMessageId ? '编辑留言' : '发表新留言'}
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="messageTitle">留言标题</Label>
                  <Input
                    id="messageTitle"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                    placeholder="为你的留言起个标题..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="content">留言内容</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="分享你的想法..."
                    rows={4}
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

                <div>
                  <Label>谈及的作品（可选）</Label>
                  <Tabs value={workSelectionType} onValueChange={(v) => setWorkSelectionType(v as any)} className="mt-2">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="none">无</TabsTrigger>
                      <TabsTrigger value="existing">从本站选择</TabsTrigger>
                      <TabsTrigger value="custom">自定义标题</TabsTrigger>
                    </TabsList>

                    <TabsContent value="none" className="mt-3">
                      <p className="text-sm text-gray-500">此留言不关联任何作品</p>
                    </TabsContent>

                    <TabsContent value="existing" className="mt-3 space-y-3">
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
                                {title.categories && (
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-xs text-gray-700 rounded">
                                    {title.categories.name}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="custom" className="mt-3">
                      <Input
                        value={customWorkTitle}
                        onChange={(e) => setCustomWorkTitle(e.target.value)}
                        placeholder="输入作品名称..."
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        用于本站尚未收录的作品
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (editingMessageId ? '更新中...' : '提交中...') : (editingMessageId ? '更新留言' : '提交留言')}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    {message.title && (
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {message.title}
                      </h3>
                    )}
                    <time className="text-sm text-gray-500">
                      {new Date(message.created_at).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                    {(message.titles || message.custom_work_title) && (
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <span className="text-gray-500">谈及的作品：</span>
                        {message.titles ? (
                          <Link
                            href={`/t/${message.titles.id}`}
                            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {message.titles.title}
                            {message.titles.japanese_title && ` (${message.titles.japanese_title})`}
                          </Link>
                        ) : (
                          <span className="font-medium text-gray-700">{message.custom_work_title}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {user && message.created_by === user.id && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(message)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(message.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed mb-3">
                  {message.content}
                </p>
                {message.images && message.images.length > 0 && (
                  <div className="mt-3">
                    {message.images.length === 1 ? (
                      <img
                        src={message.images[0]}
                        alt="Message image"
                        className="w-full max-h-80 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openImageViewer(message.images, 0)}
                      />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {message.images.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={img}
                              alt={`Image ${idx + 1}`}
                              className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => openImageViewer(message.images, idx)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {messages.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">暂无留言</p>
              </CardContent>
            </Card>
          )}
        </div>
        </div>
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这条留言吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showViewer && (
        <ImageViewer
          images={viewerImages}
          initialIndex={viewerInitialIndex}
          onClose={() => setShowViewer(false)}
        />
      )}
    </SidebarLayout>
  );
}
