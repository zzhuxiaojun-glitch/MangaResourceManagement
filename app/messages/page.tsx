'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Link from 'next/link';
import { ImageCarousel } from '@/components/image-carousel';

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

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent mb-2">
            留言板
          </h1>
          <p className="text-gray-600">分享与交流</p>
        </div>

        <div className="space-y-6">
          {messages.map((message) => (
            <Card key={message.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="bg-white border-b">
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
              <CardContent className="pt-6">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed mb-4">
                  {message.content}
                </p>
                {message.images && message.images.length > 0 && (
                  <div className="mt-4">
                    {message.images.length === 1 ? (
                      <img
                        src={message.images[0]}
                        alt="Message image"
                        className="w-full max-h-96 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {message.images.map((img, idx) => (
                          <div key={idx} className="relative group cursor-pointer">
                            <img
                              src={img}
                              alt={`Image ${idx + 1}`}
                              className="w-full h-40 object-cover rounded-lg hover:opacity-90 transition-opacity"
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
              <CardContent className="text-center py-16">
                <p className="text-gray-500 text-lg">暂无留言</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
