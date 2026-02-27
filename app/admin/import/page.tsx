'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Category } from '@/lib/supabase';
import { AdminNav } from '@/components/admin-nav';
import { ProtectedRoute } from '@/lib/protected-route';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle, FileSpreadsheet } from 'lucide-react';

type ImportResult = {
  newTitles: number;
  updatedTitles: number;
  newResources: number;
  skippedRows: number;
  errors: string[];
};

function ImportContent() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    setCategories(data || []);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      values.push(current.trim());
      return values;
    });
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: '请选择文件',
        description: '请先选择要导入的 CSV 文件',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCategory) {
      toast({
        title: '请选择分类',
        description: '请选择要导入的分类',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    const importResult: ImportResult = {
      newTitles: 0,
      updatedTitles: 0,
      newResources: 0,
      skippedRows: 0,
      errors: [],
    };

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('CSV 文件为空');
      }

      const headers = rows[0].map(h => h.toLowerCase().trim());

      const getColumnIndex = (names: string[]) => {
        for (const name of names) {
          const index = headers.indexOf(name);
          if (index !== -1) return index;
        }
        return -1;
      };

      const titleIdx = getColumnIndex(['title', '作品名', '标题']);
      const authorIdx = getColumnIndex(['author', '作者']);
      const tagsIdx = getColumnIndex(['tags', '标签']);
      const languageIdx = getColumnIndex(['language', '语言']);
      const statusIdx = getColumnIndex(['status', '状态']);
      const urlIdx = getColumnIndex(['url', '链接', '地址']);
      const extractCodeIdx = getColumnIndex(['extract_code', 'extractcode', '提取码']);
      const noteIdx = getColumnIndex(['note', '备注']);
      const summaryIdx = getColumnIndex(['summary', '简介']);
      const altTitlesIdx = getColumnIndex(['alt_titles', 'alttitles', '别名']);

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        if (row.length === 0 || row.every(cell => !cell.trim())) {
          importResult.skippedRows++;
          continue;
        }

        try {
          const titleName = titleIdx >= 0 ? row[titleIdx]?.trim() : '';
          const url = urlIdx >= 0 ? row[urlIdx]?.trim() : '';

          if (!titleName) {
            importResult.skippedRows++;
            importResult.errors.push(`第 ${i + 1} 行：缺少作品名称`);
            continue;
          }

          const { data: existingTitle } = await supabase
            .from('titles')
            .select('*')
            .eq('title', titleName)
            .eq('category_id', selectedCategory)
            .maybeSingle();

          let titleId: string;

          if (existingTitle) {
            const updates: any = {
              updated_at: new Date().toISOString(),
            };

            if (authorIdx >= 0 && row[authorIdx]) updates.author = row[authorIdx].trim();
            if (tagsIdx >= 0 && row[tagsIdx]) updates.tags = row[tagsIdx].trim();
            if (languageIdx >= 0 && row[languageIdx]) updates.language = row[languageIdx].trim();
            if (statusIdx >= 0 && row[statusIdx]) updates.status = row[statusIdx].trim();
            if (summaryIdx >= 0 && row[summaryIdx]) updates.summary = row[summaryIdx].trim();
            if (altTitlesIdx >= 0 && row[altTitlesIdx]) updates.alt_titles = row[altTitlesIdx].trim();

            await supabase
              .from('titles')
              .update(updates)
              .eq('id', existingTitle.id);

            titleId = existingTitle.id;
            importResult.updatedTitles++;
          } else {
            const newTitle = {
              category_id: selectedCategory,
              title: titleName,
              author: authorIdx >= 0 ? row[authorIdx]?.trim() || '' : '',
              tags: tagsIdx >= 0 ? row[tagsIdx]?.trim() || '' : '',
              language: languageIdx >= 0 ? row[languageIdx]?.trim() || '其他' : '其他',
              status: statusIdx >= 0 ? row[statusIdx]?.trim() || '有效' : '有效',
              summary: summaryIdx >= 0 ? row[summaryIdx]?.trim() || '' : '',
              alt_titles: altTitlesIdx >= 0 ? row[altTitlesIdx]?.trim() || '' : '',
            };

            const { data, error } = await supabase
              .from('titles')
              .insert([newTitle])
              .select()
              .single();

            if (error) throw error;

            titleId = data.id;
            importResult.newTitles++;
          }

          if (url) {
            const newResource = {
              title_id: titleId,
              provider: 'BaiduPan',
              url: url,
              extract_code: extractCodeIdx >= 0 ? row[extractCodeIdx]?.trim() || '' : '',
              note: noteIdx >= 0 ? row[noteIdx]?.trim() || '' : '',
              is_active: true,
            };

            const { error } = await supabase.from('resources').insert([newResource]);

            if (error) throw error;

            importResult.newResources++;
          }
        } catch (error: any) {
          importResult.errors.push(`第 ${i + 1} 行：${error.message}`);
        }
      }

      setResult(importResult);

      toast({
        title: '导入完成',
        description: `新增 ${importResult.newTitles} 个作品，更新 ${importResult.updatedTitles} 个作品，添加 ${importResult.newResources} 个资源`,
      });
    } catch (error: any) {
      toast({
        title: '导入失败',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">CSV 导入</h1>

          {/* CSV 转换器按钮 - 格式转换工具，不直接写入数据库 */}
          <Button
            variant="outline"
            onClick={() => router.push('/admin/import/converter')}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            CSV 转换器
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>导入设置</CardTitle>
            <CardDescription>
              上传 CSV 文件批量导入作品和资源
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>选择分类 *</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="选择要导入的分类" />
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
              <Label>选择 CSV 文件 *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    {file ? (
                      <>
                        <FileText className="h-12 w-12 text-gray-400" />
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-gray-500">
                          点击选择其他文件
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400" />
                        <div className="text-sm font-medium">点击上传 CSV 文件</div>
                        <div className="text-xs text-gray-500">
                          支持的列：title, author, tags, language, status, url, extract_code, note
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <Button
              onClick={handleImport}
              disabled={!file || !selectedCategory || importing}
              className="w-full"
            >
              {importing ? '导入中...' : '开始导入'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>导入结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">新增作品</div>
                  <div className="text-2xl font-bold text-green-600">
                    {result.newTitles}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">更新作品</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {result.updatedTitles}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600">新增资源</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {result.newResources}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">跳过行数</div>
                  <div className="text-2xl font-bold text-gray-600">
                    {result.skippedRows}
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="font-semibold">错误信息</span>
                  </div>
                  <div className="space-y-1 text-sm text-red-600 max-h-40 overflow-y-auto">
                    {result.errors.map((error, idx) => (
                      <div key={idx}>{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>CSV 格式说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">支持的列名（不区分大小写）：</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li><code>title</code> - 作品名称（必填）</li>
                  <li><code>author</code> - 作者</li>
                  <li><code>tags</code> - 标签（逗号分隔）</li>
                  <li><code>language</code> - 语言（生肉/熟肉/中/日/英/其他）</li>
                  <li><code>status</code> - 状态（有效/失效/待补/连载中/已完结）</li>
                  <li><code>url</code> - 资源链接</li>
                  <li><code>extract_code</code> - 提取码</li>
                  <li><code>note</code> - 备注</li>
                  <li><code>summary</code> - 简介</li>
                  <li><code>alt_titles</code> - 别名（逗号分隔）</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">导入逻辑：</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>如果作品名在该分类下已存在，则更新作品信息并追加资源链接</li>
                  <li>如果作品名不存在，则创建新作品</li>
                  <li>每行至少需要包含 title 列</li>
                  <li>缺少的列将使用默认值</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">CSV 示例：</h3>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
{`title,author,tags,language,status,url,extract_code
进击的巨人,谏山创,少年,日,已完结,https://pan.baidu.com/s/xxx,abc123
海贼王,尾田荣一郎,少年,日,连载中,https://pan.baidu.com/s/yyy,def456`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function ImportPage() {
  return (
    <ProtectedRoute>
      <ImportContent />
    </ProtectedRoute>
  );
}
