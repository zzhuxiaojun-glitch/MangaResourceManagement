'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
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
  content: string;
  images: string[];
  referenced_title_id: string | null;
  custom_work_title: string | null;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  titles?: {
    title: string;
    japanese_title: string | null;
  };
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
            title,
            japanese_title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish(id: string, currentState: boolean) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_published: !currentState, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      loadMessages();
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setDeleteId(null);
    }
  }

  function openImageViewer(images: string[], index: number) {
    setViewerImages(images);
    setViewerInitialIndex(index);
    setShowViewer(true);
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">留言管理</h1>
          <p className="text-gray-500 mt-1">管理留言板内容</p>
        </div>
        <Link href="/admin/messages/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新增留言
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {messages.map((message) => (
          <Card key={message.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{new Date(message.created_at).toLocaleDateString('zh-CN')}</CardTitle>
                    {!message.is_published && (
                      <Badge variant="secondary">未发布</Badge>
                    )}
                  </div>
                  {(message.titles || message.custom_work_title) && (
                    <CardDescription>
                      谈及的作品：
                      {message.titles ? (
                        <span className="font-medium text-blue-600">
                          {message.titles.title}
                          {message.titles.japanese_title && ` (${message.titles.japanese_title})`}
                        </span>
                      ) : (
                        <span className="font-medium">{message.custom_work_title}</span>
                      )}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePublish(message.id, message.is_published)}
                  >
                    {message.is_published ? (
                      <><EyeOff className="h-4 w-4 mr-1" /> 隐藏</>
                    ) : (
                      <><Eye className="h-4 w-4 mr-1" /> 发布</>
                    )}
                  </Button>
                  <Link href={`/admin/messages/${message.id}`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4 mr-1" />
                      编辑
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteId(message.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap mb-4">{message.content}</p>
              {message.images && message.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {message.images.slice(0, 9).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Image ${idx + 1}`}
                      className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageViewer(message.images, idx)}
                    />
                  ))}
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条留言吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
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
    </div>
  );
}
