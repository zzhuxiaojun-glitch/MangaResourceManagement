'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload, Plus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  images: string[];
  referenced_title_id: string | null;
  custom_work_title: string | null;
  created_at: string;
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
  main_type: string;
}

export default function MessagesPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [workSelectionType, setWorkSelectionType] = useState<'existing' | 'custom' | 'none'>('none');
  const [referencedTitleId, setReferencedTitleId] = useState<string | null>(null);
  const [customWorkTitle, setCustomWorkTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Title[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      searchTitles();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

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

  function resetForm() {
    setContent('');
    setImages([]);
    setImageInput('');
    setWorkSelectionType('none');
    setReferencedTitleId(null);
    setCustomWorkTitle('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedTitle(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const messageData: any = {
        content,
        images,
        is_published: false,
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

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) throw error;

      toast({
        title: '提交成功',
        description: '您的留言已提交，待管理员审核后显示',
      });

      resetForm();
    } catch (error) {
      console.error('Error submitting message:', error);
      toast({
        title: '提交失败',
        description: '无法提交留言，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-center text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-4xl">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">留言板</h1>
            <p className="text-gray-600 mt-1">分享与交流</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? '取消' : '发表留言'}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-semibold">发表新留言</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group">
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
                  )}
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
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索漫画、动画、电子书..."
                      />

                      {selectedTitle && (
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{selectedTitle.title}</p>
                              {selectedTitle.japanese_title && (
                                <p className="text-sm text-gray-600">{selectedTitle.japanese_title}</p>
                              )}
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
                        <div className="border rounded max-h-48 overflow-y-auto">
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
                            </button>
                          ))}
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
                    {submitting ? '提交中...' : '提交留言'}
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <time className="text-sm text-gray-500">
                    {new Date(message.created_at).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  {(message.titles || message.custom_work_title) && (
                    <div className="flex items-center gap-2 text-sm">
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
                        className="w-full max-h-80 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {message.images.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={img}
                              alt={`Image ${idx + 1}`}
                              className="w-full h-32 object-cover rounded"
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
  );
}
