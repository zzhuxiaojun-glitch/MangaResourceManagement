'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { ProtectedRoute } from '@/lib/protected-route';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Upload, FileText, Info } from 'lucide-react';

/**
 * CSV 转换器页面组件
 *
 * 功能说明：
 * 这是一个格式转换工具，用于将其他格式的 CSV 文件转换为系统批量导入所需的标准格式
 * 注意：此页面不直接写入数据库，仅进行格式转换和预览
 */
function ConverterContent() {
  // Next.js 路由钩子，用于页面导航
  const router = useRouter();

  // 状态管理：存储用户上传的 CSV 文件
  const [file, setFile] = useState<File | null>(null);

  /**
   * 处理文件上传事件
   *
   * @param e - 文件输入框的 change 事件
   *
   * 功能：
   * 1. 检查用户是否选择了文件
   * 2. 将选中的文件存储到组件状态中
   * 3. 重置之前的转换结果（如果有）
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // TODO: 在这里重置转换结果状态
    }
  };

  /**
   * 返回导入页面
   *
   * 功能：使用路由导航返回到 CSV 导入页面
   */
  const handleBack = () => {
    router.push('/admin/import');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 管理员导航栏 */}
      <AdminNav />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 页面标题区域 */}
        <div className="mb-8">
          {/* 返回按钮 */}
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回导入页
          </Button>

          {/* 页面主标题 */}
          <h1 className="text-3xl font-bold mb-2">CSV 转换器</h1>
          <p className="text-gray-600">
            将在线文档导出的 CSV 格式转换为批量导入所需的标准格式
          </p>
        </div>

        {/* 提示信息卡片 */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>说明：</strong>此工具仅用于格式转换，不会直接写入数据库。
            转换完成后，您可以下载标准格式的 CSV 文件，然后在"CSV 导入"页面进行批量导入。
          </AlertDescription>
        </Alert>

        {/* 文件上传卡片 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>上传源文件</CardTitle>
            <CardDescription>
              选择需要转换的 CSV 文件（支持从 Google Sheets、Excel 等导出的格式）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 文件上传区域 */}
            <div className="space-y-2">
              <Label>选择 CSV 文件</Label>

              {/* 拖拽上传区域 */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                {/* 隐藏的文件输入框 */}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-converter-upload"
                />

                {/* 点击上传的标签区域 */}
                <label htmlFor="csv-converter-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    {/* 根据是否有文件显示不同的界面 */}
                    {file ? (
                      <>
                        {/* 已选择文件的状态 */}
                        <FileText className="h-12 w-12 text-green-500" />
                        <div className="text-sm font-medium text-green-700">
                          {file.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          文件大小: {(file.size / 1024).toFixed(2)} KB
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          点击选择其他文件
                        </div>
                      </>
                    ) : (
                      <>
                        {/* 未选择文件的状态 */}
                        <Upload className="h-12 w-12 text-gray-400" />
                        <div className="text-sm font-medium">
                          点击上传 CSV 文件
                        </div>
                        <div className="text-xs text-gray-500">
                          支持 .csv 格式文件
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 转换按钮（目前显示"开发中"） */}
            <Button
              disabled={!file}
              className="w-full"
              variant="secondary"
            >
              🚧 转换功能开发中
            </Button>
          </CardContent>
        </Card>

        {/* 转换说明卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>转换说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              {/* 支持的源格式 */}
              <div>
                <h3 className="font-semibold mb-2">支持的源格式：</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Google Sheets 导出的 CSV</li>
                  <li>Microsoft Excel 导出的 CSV</li>
                  <li>其他在线文档工具导出的 CSV</li>
                </ul>
              </div>

              {/* 转换流程 */}
              <div>
                <h3 className="font-semibold mb-2">转换流程：</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>上传源 CSV 文件</li>
                  <li>系统自动识别列名和数据格式</li>
                  <li>将数据映射为标准导入格式</li>
                  <li>预览转换结果</li>
                  <li>下载标准格式的 CSV 文件</li>
                  <li>使用下载的文件在"CSV 导入"页面进行批量导入</li>
                </ol>
              </div>

              {/* 标准格式说明 */}
              <div>
                <h3 className="font-semibold mb-2">目标标准格式：</h3>
                <p className="text-gray-600 mb-2">
                  转换后的 CSV 将包含以下标准列：
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li><code className="bg-gray-100 px-1 rounded">title</code> - 作品名称（必填）</li>
                  <li><code className="bg-gray-100 px-1 rounded">author</code> - 作者</li>
                  <li><code className="bg-gray-100 px-1 rounded">tags</code> - 标签</li>
                  <li><code className="bg-gray-100 px-1 rounded">language</code> - 语言</li>
                  <li><code className="bg-gray-100 px-1 rounded">status</code> - 状态</li>
                  <li><code className="bg-gray-100 px-1 rounded">url</code> - 资源链接</li>
                  <li><code className="bg-gray-100 px-1 rounded">extract_code</code> - 提取码</li>
                  <li><code className="bg-gray-100 px-1 rounded">note</code> - 备注</li>
                  <li><code className="bg-gray-100 px-1 rounded">summary</code> - 简介</li>
                  <li><code className="bg-gray-100 px-1 rounded">alt_titles</code> - 别名</li>
                </ul>
              </div>

              {/* 开发状态提示 */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>🚧 开发中：</strong>
                  CSV 格式转换功能正在开发中，敬请期待！
                  完成后将支持智能列名识别、数据映射和格式验证等功能。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

/**
 * CSV 转换器页面导出组件
 *
 * 使用 ProtectedRoute 包装，确保只有登录的管理员才能访问
 */
export default function ConverterPage() {
  return (
    <ProtectedRoute>
      <ConverterContent />
    </ProtectedRoute>
  );
}
