'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Category, Title, Resource } from '@/lib/supabase';
import { AdminNav } from '@/components/admin-nav';
import { ProtectedRoute } from '@/lib/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, AlertCircle, Upload, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function TitleEditContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const isNew = params.id === 'new';

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState<Partial<Title>>({
    title: '',
    category_id: '',
    alt_titles: '',
    author: '',
    tags: '',
    language: '其他',
    status: '有效',
    summary: '',
    japanese_title: '',
    resource_link: '',
    cover_image: '',
    preview_images: [],
  });
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResource, setNewResource] = useState({
    provider: 'BaiduPan',
    url: '',
    extract_code: '',
    note: '',
  });

  useEffect(() => {
    loadCategories();
    if (!isNew) {
      loadTitle();
      loadResources();
    }
  }, [params.id]);

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    setCategories(data || []);
  }

  async function loadTitle() {
    const { data } = await supabase
      .from('titles')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (data) {
      setTitle(data);
    }
  }

  async function loadResources() {
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('title_id', params.id)
      .order('created_at', { ascending: false });

    setResources(data || []);
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'preview') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      toast({
        title: '文件过大',
        description: '图片大小不能超过 5MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === 'cover') {
        setTitle({ ...title, cover_image: base64String });
      } else {
        const currentPreviews = title.preview_images || [];
        if (currentPreviews.length >= 10) {
          toast({
            title: '数量限制',
            description: '最多只能上传 10 张内页预览图',
            variant: 'destructive',
          });
          return;
        }
        setTitle({ ...title, preview_images: [...currentPreviews, base64String] });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCoverImage = () => {
    setTitle({ ...title, cover_image: '' });
  };

  const handleRemovePreviewImage = (index: number) => {
    const currentPreviews = title.preview_images || [];
    const newPreviews = currentPreviews.filter((_, i) => i !== index);
    setTitle({ ...title, preview_images: newPreviews });
  };

  const handleSaveTitle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.title || !title.category_id) {
      toast({
        title: '验证失败',
        description: '请填写作品名称和分类',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isNew) {
        const { data, error } = await supabase
          .from('titles')
          .insert([{ ...title, updated_at: new Date().toISOString() }])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: '创建成功',
          description: '作品已创建',
        });

        router.push(`/admin/titles/${data.id}`);
      } else {
        const { error } = await supabase
          .from('titles')
          .update({ ...title, updated_at: new Date().toISOString() })
          .eq('id', params.id);

        if (error) throw error;

        toast({
          title: '更新成功',
          description: '作品已更新',
        });

        loadTitle();
      }
    } catch (error: any) {
      toast({
        title: '操作失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddResource = async () => {
    if (!newResource.url) {
      toast({
        title: '验证失败',
        description: '请填写资源链接',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('resources').insert([
        {
          title_id: params.id,
          ...newResource,
          is_active: true,
        },
      ]);

      if (error) throw error;

      toast({
        title: '添加成功',
        description: '资源已添加',
      });

      setNewResource({
        provider: 'BaiduPan',
        url: '',
        extract_code: '',
        note: '',
      });

      loadResources();
    } catch (error: any) {
      toast({
        title: '添加失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleResourceActive = async (resourceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ is_active: !isActive })
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: '更新成功',
        description: `资源已${!isActive ? '启用' : '禁用'}`,
      });

      loadResources();
    } catch (error: any) {
      toast({
        title: '更新失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('确定要删除此资源吗？')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: '删除成功',
        description: '资源已删除',
      });

      loadResources();
    } catch (error: any) {
      toast({
        title: '删除失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllInactive = async () => {
    if (!confirm('确定要标记该作品的所有资源为失效吗？')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('resources')
        .update({ is_active: false })
        .eq('title_id', params.id);

      if (error) throw error;

      toast({
        title: '更新成功',
        description: '所有资源已标记为失效',
      });

      loadResources();
    } catch (error: any) {
      toast({
        title: '更新失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <Link href="/admin/titles">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">
          {isNew ? '新建作品' : '编辑作品'}
        </h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>作品信息</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveTitle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">作品名称 *</Label>
                  <Input
                    id="title"
                    value={title.title}
                    onChange={(e) => setTitle({ ...title, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">分类 *</Label>
                  <Select
                    value={title.category_id}
                    onValueChange={(value) =>
                      setTitle({ ...title, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">作者</Label>
                  <Input
                    id="author"
                    value={title.author}
                    onChange={(e) => setTitle({ ...title, author: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">语言</Label>
                  <Select
                    value={title.language}
                    onValueChange={(value) => setTitle({ ...title, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="生肉">生肉</SelectItem>
                      <SelectItem value="熟肉">熟肉</SelectItem>
                      <SelectItem value="中">中文</SelectItem>
                      <SelectItem value="日">日文</SelectItem>
                      <SelectItem value="英">英文</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">状态</Label>
                  <Select
                    value={title.status}
                    onValueChange={(value) => setTitle({ ...title, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="有效">有效</SelectItem>
                      <SelectItem value="失效">失效</SelectItem>
                      <SelectItem value="待补">待补</SelectItem>
                      <SelectItem value="连载中">连载中</SelectItem>
                      <SelectItem value="已完结">已完结</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">标签（逗号分隔）</Label>
                  <Input
                    id="tags"
                    value={title.tags}
                    onChange={(e) => setTitle({ ...title, tags: e.target.value })}
                    placeholder="例：BL,GL,SF"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="japanese_title">日文原名</Label>
                <Input
                  id="japanese_title"
                  value={title.japanese_title}
                  onChange={(e) =>
                    setTitle({ ...title, japanese_title: e.target.value })
                  }
                  placeholder="例：僕のヒーローアカデミア"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt_titles">别名（逗号分隔）</Label>
                <Input
                  id="alt_titles"
                  value={title.alt_titles}
                  onChange={(e) =>
                    setTitle({ ...title, alt_titles: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource_link">资源链接</Label>
                <Input
                  id="resource_link"
                  value={title.resource_link}
                  onChange={(e) =>
                    setTitle({ ...title, resource_link: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">简介</Label>
                <Textarea
                  id="summary"
                  value={title.summary}
                  onChange={(e) => setTitle({ ...title, summary: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>封面图片</Label>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          id="cover-upload"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'cover')}
                          className="hidden"
                        />
                        <label
                          htmlFor="cover-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">
                            点击上传封面图片
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            支持 JPG、PNG，最大 5MB
                          </span>
                        </label>
                      </div>
                    </div>
                    {title.cover_image && (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                        <Image
                          src={title.cover_image}
                          alt="封面预览"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveCoverImage}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>内页预览图（最多10张）</Label>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        id="preview-upload"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'preview')}
                        className="hidden"
                        disabled={(title.preview_images?.length || 0) >= 10}
                      />
                      <label
                        htmlFor="preview-upload"
                        className={`cursor-pointer flex flex-col items-center ${
                          (title.preview_images?.length || 0) >= 10
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          点击上传内页预览图 ({title.preview_images?.length || 0}/10)
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          支持 JPG、PNG，最大 5MB
                        </span>
                      </label>
                    </div>

                    {title.preview_images && title.preview_images.length > 0 && (
                      <div className="grid grid-cols-5 gap-4">
                        {title.preview_images.map((img, index) => (
                          <div
                            key={index}
                            className="relative aspect-square border rounded-lg overflow-hidden"
                          >
                            <Image
                              src={img}
                              alt={`预览 ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePreviewImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-1">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit">{isNew ? '创建作品' : '保存更改'}</Button>
            </form>
          </CardContent>
        </Card>

        {!isNew && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>资源链接</CardTitle>
                  <CardDescription>管理该作品的资源链接</CardDescription>
                </div>
                {resources.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleMarkAllInactive}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    全部标记失效
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold">添加新资源</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>提供商</Label>
                    <Select
                      value={newResource.provider}
                      onValueChange={(value) =>
                        setNewResource({ ...newResource, provider: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BaiduPan">百度网盘</SelectItem>
                        <SelectItem value="AliyunDrive">阿里云盘</SelectItem>
                        <SelectItem value="Mega">Mega</SelectItem>
                        <SelectItem value="Other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>提取码</Label>
                    <Input
                      value={newResource.extract_code}
                      onChange={(e) =>
                        setNewResource({ ...newResource, extract_code: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label>资源链接 *</Label>
                    <Input
                      value={newResource.url}
                      onChange={(e) =>
                        setNewResource({ ...newResource, url: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label>备注</Label>
                    <Input
                      value={newResource.note}
                      onChange={(e) =>
                        setNewResource({ ...newResource, note: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleAddResource}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加资源
                </Button>
              </div>

              <div>
                <h3 className="font-semibold mb-4">现有资源</h3>
                {resources.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">暂无资源</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>提供商</TableHead>
                        <TableHead>链接</TableHead>
                        <TableHead>提取码</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resources.map((resource) => (
                        <TableRow key={resource.id}>
                          <TableCell>{resource.provider}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {resource.url}
                          </TableCell>
                          <TableCell>{resource.extract_code || '-'}</TableCell>
                          <TableCell>
                            {resource.is_active ? (
                              <span className="text-green-600">有效</span>
                            ) : (
                              <span className="text-red-600">失效</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleToggleResourceActive(
                                  resource.id,
                                  resource.is_active
                                )
                              }
                            >
                              {resource.is_active ? '标记失效' : '标记有效'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteResource(resource.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function TitleEditPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <TitleEditContent params={params} />
    </ProtectedRoute>
  );
}
