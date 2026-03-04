'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Upload, X, GripVertical } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

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

export default function AdminPlatformsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<PlatformCategory[]>([]);
  const [platforms, setPlatforms] = useState<MangaPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<MangaPlatform | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    japanese_title: '',
    description: '',
    publisher: '',
    platform_type: '',
    representative_works: [] as string[],
    website_url: '',
    images: [] as string[],
    sort_order: 0,
    is_active: true,
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [newWork, setNewWork] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    setLoading(true);

    const { data: categoriesData } = await supabase
      .from('platform_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    const { data: platformsData } = await supabase
      .from('manga_platforms')
      .select('*')
      .order('sort_order', { ascending: true });

    setCategories(categoriesData || []);
    setPlatforms(platformsData || []);
    setLoading(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || formData.images.length >= 5) {
      alert('最多只能上传5张图片');
      return;
    }

    const remainingSlots = 5 - formData.images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `platforms/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('public-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('public-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setFormData({
        ...formData,
        images: [...formData.images, ...uploadedUrls],
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('图片上传失败');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...formData.images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setFormData({ ...formData, images: newImages });
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  function addRepresentativeWork() {
    if (newWork.trim() && formData.representative_works.length < 10) {
      setFormData({
        ...formData,
        representative_works: [...formData.representative_works, newWork.trim()],
      });
      setNewWork('');
    }
  }

  function removeRepresentativeWork(index: number) {
    setFormData({
      ...formData,
      representative_works: formData.representative_works.filter((_, i) => i !== index),
    });
  }

  function openCreateDialog() {
    setEditingPlatform(null);
    setFormData({
      category_id: categories[0]?.id || '',
      name: '',
      japanese_title: '',
      description: '',
      publisher: '',
      platform_type: '',
      representative_works: [],
      website_url: '',
      images: [],
      sort_order: 0,
      is_active: true,
    });
    setNewWork('');
    setDialogOpen(true);
  }

  function openEditDialog(platform: MangaPlatform) {
    setEditingPlatform(platform);
    setFormData({
      category_id: platform.category_id,
      name: platform.name,
      japanese_title: platform.japanese_title || '',
      description: platform.description,
      publisher: platform.publisher || '',
      platform_type: platform.platform_type || '',
      representative_works: platform.representative_works || [],
      website_url: platform.website_url,
      images: platform.images || [],
      sort_order: platform.sort_order,
      is_active: platform.is_active,
    });
    setNewWork('');
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingPlatform) {
        const { error } = await supabase
          .from('manga_platforms')
          .update(formData)
          .eq('id', editingPlatform.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('manga_platforms')
          .insert([formData]);

        if (error) throw error;
      }

      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving platform:', error);
      alert('保存失败');
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('manga_platforms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting platform:', error);
      alert('删除失败');
    }
  }

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">漫画平台管理</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              添加平台
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlatform ? '编辑平台' : '添加平台'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category">分类</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
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

              <div>
                <Label htmlFor="name">平台名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="japanese_title">日文标题（可选）</Label>
                <Input
                  id="japanese_title"
                  value={formData.japanese_title}
                  onChange={(e) => setFormData({ ...formData, japanese_title: e.target.value })}
                  placeholder="例如：マンガワン"
                />
              </div>

              <div>
                <Label htmlFor="publisher">发行方（可选）</Label>
                <Input
                  id="publisher"
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="platform_type">平台类型（可选）</Label>
                <Input
                  id="platform_type"
                  value={formData.platform_type}
                  onChange={(e) => setFormData({ ...formData, platform_type: e.target.value })}
                  placeholder="例如：网站+APP"
                />
              </div>

              <div>
                <Label>代表作品（最多10个）</Label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {formData.representative_works.map((work, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {work}
                        <button
                          type="button"
                          onClick={() => removeRepresentativeWork(index)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {formData.representative_works.length < 10 && (
                    <div className="flex gap-2">
                      <Input
                        value={newWork}
                        onChange={(e) => setNewWork(e.target.value)}
                        placeholder="输入作品名称"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addRepresentativeWork();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addRepresentativeWork}
                      >
                        添加
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">详细介绍</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                />
              </div>

              <div>
                <Label htmlFor="website_url">官网链接</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                />
              </div>

              <div>
                <Label>图片（最多5张，可拖动排序）</Label>
                <div className="mt-2">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {formData.images.map((url, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className="relative cursor-move group"
                      >
                        <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs z-10">
                          {index + 1}
                        </div>
                        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-5 w-5 text-white drop-shadow-lg" />
                        </div>
                        <img
                          src={url}
                          alt={`预览 ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {formData.images.length < 5 && (
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                      {uploading && <p className="text-sm text-gray-500 mt-1">上传中...</p>}
                      <p className="text-xs text-gray-500 mt-1">提示：可以拖动图片改变顺序</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="sort_order">排序顺序</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">启用</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {categories.map((category) => {
          const categoryPlatforms = platforms.filter(p => p.category_id === category.id);

          return (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category.name}
                  <Badge variant="secondary">{categoryPlatforms.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryPlatforms.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无平台</p>
                ) : (
                  <div className="space-y-2">
                    {categoryPlatforms.map((platform) => (
                      <div
                        key={platform.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{platform.name}</h3>
                            {!platform.is_active && (
                              <Badge variant="destructive">已禁用</Badge>
                            )}
                          </div>
                          {platform.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {platform.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>排序: {platform.sort_order}</span>
                            <span>图片: {platform.images?.length || 0}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(platform)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除平台"{platform.name}"吗？此操作无法撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(platform.id)}>
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
