'use client';

import { useEffect, useState } from 'react';
import { supabase, Category, TitleWithCategory } from '@/lib/supabase';
import { AdminNav } from '@/components/admin-nav';
import { ProtectedRoute } from '@/lib/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

function TitlesContent() {
  const [titles, setTitles] = useState<TitleWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadTitles();
  }, [categoryFilter]);

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    setCategories(data || []);
  }

  async function loadTitles() {
    let query = supabase
      .from('titles')
      .select('*, categories(*)')
      .order('updated_at', { ascending: false });

    if (categoryFilter !== 'all') {
      query = query.eq('category_id', categoryFilter);
    }

    const { data } = await query;

    setTitles(data || []);
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此作品吗？该作品下的所有资源也会被删除。')) {
      return;
    }

    try {
      const { error } = await supabase.from('titles').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: '删除成功',
        description: '作品已删除',
      });

      loadTitles();
    } catch (error: any) {
      toast({
        title: '删除失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredTitles = titles.filter((title) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      title.title.toLowerCase().includes(term) ||
      title.author.toLowerCase().includes(term) ||
      title.tags.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">作品管理</h1>
          <Link href="/admin/titles/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建作品
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索作品、作者、标签..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>作品名</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>作者</TableHead>
                <TableHead>语言</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTitles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    暂无作品
                  </TableCell>
                </TableRow>
              ) : (
                filteredTitles.map((title) => (
                  <TableRow key={title.id}>
                    <TableCell className="font-medium">{title.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{title.categories.name}</Badge>
                    </TableCell>
                    <TableCell>{title.author || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{title.language}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={title.status === '有效' ? 'default' : 'destructive'}
                      >
                        {title.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(title.updated_at).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/titles/${title.id}`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(title.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}

export default function TitlesPage() {
  return (
    <ProtectedRoute>
      <TitlesContent />
    </ProtectedRoute>
  );
}
