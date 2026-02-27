'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { AdminNav } from '@/components/admin-nav';
import { ProtectedRoute } from '@/lib/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Upload, FileText, Info, Download, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * 转换后的数据行类型定义
 *
 * 这是目标 CSV 的标准格式，包含所有导入系统需要的字段
 */
interface ConvertedRow {
  title: string;           // 作品名称（必填）
  author: string;          // 作者
  tags: string;            // 标签（多个用逗号分隔）
  language: string;        // 语言
  status: string;          // 状态（连载中/完结等）
  url: string;             // 资源链接
  extract_code: string;    // 提取码/密码
  note: string;            // 备注
  summary: string;         // 简介
  alt_titles: string;      // 别名（多个用逗号分隔）
}

/**
 * CSV 转换器页面组件
 *
 * 功能说明：
 * 这是一个纯前端的格式转换工具，用于将其他格式的 CSV 文件转换为系统批量导入所需的标准格式
 *
 * 核心流程：
 * 1. 用户上传源 CSV 文件
 * 2. 使用 PapaParse 解析文件为 JSON 数组
 * 3. 用户选择哪一列是"原始文本列"（包含待提取的混合信息）
 * 4. 用户填写默认值（tags、language、status）
 * 5. 从原始文本中使用正则表达式提取各字段
 * 6. 预览转换结果（前 20 行）
 * 7. 下载转换后的标准格式 CSV
 *
 * 注意：此页面不直接写入数据库，仅进行格式转换和预览
 */
function ConverterContent() {
  // ===== 路由和状态管理 =====
  const router = useRouter();

  // 文件和解析状态
  const [file, setFile] = useState<File | null>(null);                    // 用户上传的原始文件
  const [parsedData, setParsedData] = useState<any[]>([]);                // PapaParse 解析后的原始数据
  const [headers, setHeaders] = useState<string[]>([]);                   // CSV 的列名（用于列选择器）
  const [selectedColumn, setSelectedColumn] = useState<string>('');       // 用户选择的"原始文本列"

  // 转换配置和结果
  const [defaultTags, setDefaultTags] = useState<string>('');             // 默认标签
  const [defaultLanguage, setDefaultLanguage] = useState<string>('中文'); // 默认语言
  const [defaultStatus, setDefaultStatus] = useState<string>('');         // 默认状态
  const [convertedData, setConvertedData] = useState<ConvertedRow[]>([]); // 转换后的数据

  // UI 状态
  const [isConverting, setIsConverting] = useState<boolean>(false);       // 是否正在转换中
  const [error, setError] = useState<string>('');                         // 错误信息
  const [success, setSuccess] = useState<string>('');                     // 成功信息

  /**
   * 处理文件上传事件
   *
   * @param e - 文件输入框的 change 事件
   *
   * 功能流程：
   * 1. 检查用户是否选择了文件
   * 2. 重置所有状态（清空之前的转换结果）
   * 3. 将选中的文件存储到组件状态中
   * 4. 使用 PapaParse 解析 CSV 文件
   * 5. 提取列名并自动选择第一列作为默认的"原始文本列"
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // 重置所有状态
      setFile(selectedFile);
      setParsedData([]);
      setHeaders([]);
      setSelectedColumn('');
      setConvertedData([]);
      setError('');
      setSuccess('');

      // 使用 PapaParse 解析 CSV 文件
      Papa.parse(selectedFile, {
        header: true,              // 第一行作为列名
        skipEmptyLines: true,      // 跳过空行
        encoding: 'UTF-8',         // 使用 UTF-8 编码
        complete: (results) => {
          // 解析成功
          if (results.data && results.data.length > 0) {
            setParsedData(results.data);

            // 提取列名
            const columnNames = results.meta.fields || [];
            setHeaders(columnNames);

            // 默认选择第一列作为原始文本列
            if (columnNames.length > 0) {
              setSelectedColumn(columnNames[0]);
            }

            setSuccess(`成功解析 ${results.data.length} 行数据`);
          } else {
            // 文件为空
            setError('文件为空或格式不正确，请检查文件内容');
          }
        },
        error: (error) => {
          // 解析失败
          setError(`文件解析失败: ${error.message}`);
        }
      });
    }
  };

  /**
   * 从原始文本中提取 URL
   *
   * 正则表达式说明：
   * - https?:// - 匹配 http:// 或 https://
   * - [^\s<>"]+ - 匹配非空白、非尖括号、非引号的字符（URL 主体）
   *
   * @param text - 原始文本
   * @returns 提取到的第一个 URL，如果没有则返回空字符串
   */
  const extractUrl = (text: string): string => {
    if (!text) return '';

    // 匹配 http:// 或 https:// 开头的链接
    const urlRegex = /https?:\/\/[^\s<>"]+/i;
    const match = text.match(urlRegex);

    return match ? match[0] : '';
  };

  /**
   * 从原始文本中提取提取码/密码
   *
   * 正则表达式说明：
   * - (?:提取码|密码|解压码|访问码)[:：]\s* - 匹配常见的提取码前缀（支持中英文冒号）
   * - ([a-zA-Z0-9]+) - 捕获提取码本身（字母和数字组合）
   *
   * 支持的格式示例：
   * - "提取码：abcd"
   * - "提取码: 1234"
   * - "密码：xyz123"
   * - "解压码: pass"
   *
   * @param text - 原始文本
   * @returns 提取到的提取码，如果没有则返回空字符串
   */
  const extractCode = (text: string): string => {
    if (!text) return '';

    // 匹配 "提取码：xxxx"、"密码：xxxx" 等格式（支持中英文冒号，冒号后可能有空格）
    const codeRegex = /(?:提取码|密码|解压码|访问码)[:：]\s*([a-zA-Z0-9]+)/i;
    const match = text.match(codeRegex);

    return match ? match[1] : '';
  };

  /**
   * 从原始文本中提取作者
   *
   * 提取逻辑（按优先级）：
   * 1. 优先匹配 "[作者]" 或 "【作者】" 格式
   * 2. 其次匹配 "【某某】作品合集" 或 "[某某]作品合集" 格式
   * 3. 如果都没有，返回空字符串
   *
   * 正则表达式说明：
   * - [【\[] - 匹配中文或英文左方括号
   * - ([^】\]]+) - 捕获方括号内的内容（作者名）
   * - [】\]] - 匹配中文或英文右方括号
   *
   * @param text - 原始文本
   * @returns 提取到的作者名，如果没有则返回空字符串
   */
  const extractAuthor = (text: string): string => {
    if (!text) return '';

    // 优先匹配 [作者] 或 【作者】 格式
    const authorRegex = /[【\[]([^】\]]+)[】\]]/;
    const match = text.match(authorRegex);

    if (match) {
      const content = match[1];

      // 如果匹配到 "【某某】作品合集"，提取作者名
      if (text.includes('作品合集') || text.includes('合集')) {
        return content;
      }

      // 否则，检查是否是作者标识
      // 排除常见的分类标签（如【漫画】、【动画】等）
      const excludeKeywords = ['漫画', '动画', 'MANGA', 'ANIME', '小说', '书籍'];
      if (!excludeKeywords.some(keyword => content.includes(keyword))) {
        return content;
      }
    }

    return '';
  };

  /**
   * 从原始文本中提取标题
   *
   * 提取逻辑：
   * 1. 移除常见的前缀标签（如【漫画】、【动画】等）
   * 2. 移除作者信息（如 [作者] 部分）
   * 3. 移除链接和提取码信息
   * 4. 取第一行或第一个有意义的片段作为标题
   * 5. 清理多余的空格和标点符号
   *
   * @param text - 原始文本
   * @returns 清理后的标题
   */
  const extractTitle = (text: string): string => {
    if (!text) return '';

    let title = text;

    // 移除常见的分类前缀（如【漫画】、【动画】、【小说】等）
    title = title.replace(/^[【\[](?:漫画|动画|MANGA|ANIME|小说|书籍|轻小说)[】\]]\s*/i, '');

    // 移除作者信息（如 [作者名] 或 【作者名】）
    title = title.replace(/[【\[][^】\]]+[】\]]\s*/g, '');

    // 移除 URL
    title = title.replace(/https?:\/\/[^\s<>"]+/gi, '');

    // 移除提取码信息
    title = title.replace(/(?:提取码|密码|解压码|访问码)[:：]\s*[a-zA-Z0-9]+/gi, '');

    // 取第一行（如果有换行符）
    const firstLine = title.split(/[\r\n]+/)[0];

    // 清理多余的空格和标点符号
    return firstLine.trim().replace(/\s+/g, ' ');
  };

  /**
   * 从原始文本中提取标签（简单关键词映射）
   *
   * 映射规则：
   * - 如果文本包含"漫画"、"MANGA" → 添加"漫画"标签
   * - 如果文本包含"动画"、"ANIME" → 添加"动画"标签
   * - 如果文本包含"小说"、"轻小说" → 添加"小说"标签
   * - 如果文本包含"完结" → 添加"完结"标签
   * - 如果文本包含"连载" → 添加"连载中"标签
   *
   * @param text - 原始文本
   * @returns 提取到的标签（逗号分隔），如果没有则返回空字符串
   */
  const extractTags = (text: string): string => {
    if (!text) return '';

    const tags: string[] = [];
    const upperText = text.toUpperCase();

    // 根据关键词添加标签
    if (upperText.includes('漫画') || upperText.includes('MANGA')) {
      tags.push('漫画');
    }
    if (upperText.includes('动画') || upperText.includes('ANIME')) {
      tags.push('动画');
    }
    if (upperText.includes('小说') || upperText.includes('轻小说')) {
      tags.push('小说');
    }
    if (upperText.includes('完结')) {
      tags.push('完结');
    }
    if (upperText.includes('连载')) {
      tags.push('连载中');
    }

    return tags.join(',');
  };

  /**
   * 执行转换操作
   *
   * 转换流程：
   * 1. 验证必要条件（是否有数据、是否选择了列）
   * 2. 遍历每一行数据，从原始文本列中提取各字段
   * 3. 验证关键字段（必须有 title 和 url）
   * 4. 合并提取的标签和用户设置的默认标签
   * 5. 使用用户设置的默认值填充 language 和 status
   * 6. 统计转换成功和失败的行数
   * 7. 显示转换结果
   */
  const handleConvert = () => {
    // 清空之前的消息
    setError('');
    setSuccess('');
    setIsConverting(true);

    try {
      // 验证：检查是否有解析数据
      if (parsedData.length === 0) {
        setError('没有可转换的数据，请先上传文件');
        setIsConverting(false);
        return;
      }

      // 验证：检查是否选择了原始文本列
      if (!selectedColumn) {
        setError('请选择要解析的原始文本列');
        setIsConverting(false);
        return;
      }

      const results: ConvertedRow[] = [];
      let successCount = 0;  // 成功转换的行数
      let failedCount = 0;   // 失败的行数（缺少必要字段）

      // 遍历每一行数据进行转换
      parsedData.forEach((row, index) => {
        // 获取原始文本（用户选择的列）
        const rawText = row[selectedColumn] || '';

        // 从原始文本中提取各字段
        const url = extractUrl(rawText);
        const extract_code = extractCode(rawText);
        const author = extractAuthor(rawText);
        const title = extractTitle(rawText);
        const extractedTags = extractTags(rawText);

        // 验证：必须有标题和 URL
        if (!title || !url) {
          failedCount++;
          console.warn(`第 ${index + 1} 行转换失败：缺少标题或链接`, { title, url, rawText });
          return; // 跳过这一行
        }

        // 合并提取的标签和默认标签
        const allTags = [extractedTags, defaultTags]
          .filter(Boolean)  // 过滤空值
          .join(',');       // 用逗号连接

        // 构建转换后的数据行
        const convertedRow: ConvertedRow = {
          title: title,
          author: author,
          tags: allTags,
          language: defaultLanguage,       // 使用用户设置的默认语言
          status: defaultStatus,           // 使用用户设置的默认状态
          url: url,
          extract_code: extract_code,
          note: '',                        // 备注默认为空
          summary: '',                     // 简介默认为空
          alt_titles: '',                  // 别名默认为空
        };

        results.push(convertedRow);
        successCount++;
      });

      // 验证：检查是否有成功转换的数据
      if (results.length === 0) {
        setError('转换失败：所有行都缺少必要的字段（标题和链接）。请检查源文件格式。');
        setIsConverting(false);
        return;
      }

      // 保存转换结果
      setConvertedData(results);

      // 显示成功消息
      const message = failedCount > 0
        ? `转换完成！成功 ${successCount} 行，失败 ${failedCount} 行（缺少标题或链接）`
        : `转换完成！成功转换 ${successCount} 行数据`;

      setSuccess(message);

    } catch (err: any) {
      // 捕获并显示错误
      setError(`转换过程中发生错误: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  /**
   * 下载转换后的 CSV 文件
   *
   * 功能流程：
   * 1. 使用 PapaParse 将 JSON 数组转换为 CSV 格式
   * 2. 创建一个 Blob 对象（文件数据）
   * 3. 创建一个临时下载链接
   * 4. 触发下载
   * 5. 清理临时链接
   */
  const handleDownload = () => {
    if (convertedData.length === 0) {
      setError('没有可下载的数据');
      return;
    }

    try {
      // 使用 PapaParse 将数据转换为 CSV 格式
      const csv = Papa.unparse(convertedData, {
        header: true,              // 包含列名
      });

      // 创建 Blob 对象（添加 BOM 以支持 Excel 正确显示中文）
      const BOM = '\uFEFF';  // UTF-8 BOM（Byte Order Mark）
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });

      // 创建临时下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'converted-import.csv';  // 下载文件名

      // 触发下载
      document.body.appendChild(link);
      link.click();

      // 清理临时链接
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('文件下载成功！');
    } catch (err: any) {
      setError(`下载失败: ${err.message}`);
    }
  };

  /**
   * 返回导入页面
   */
  const handleBack = () => {
    router.push('/admin/import');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 管理员导航栏 */}
      <AdminNav />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ===== 页面标题区域 ===== */}
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

        {/* ===== 提示信息 ===== */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>说明：</strong>此工具仅用于格式转换，不会直接写入数据库。
            转换完成后，您可以下载标准格式的 CSV 文件，然后在"CSV 导入"页面进行批量导入。
          </AlertDescription>
        </Alert>

        {/* ===== 错误提示 ===== */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>错误：</strong>{error}
            </AlertDescription>
          </Alert>
        )}

        {/* ===== 成功提示 ===== */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>成功：</strong>{success}
            </AlertDescription>
          </Alert>
        )}

        {/* ===== 文件上传卡片 ===== */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>1. 上传源文件</CardTitle>
            <CardDescription>
              选择需要转换的 CSV 文件（支持从 Google Sheets、Excel 等导出的格式）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                        {parsedData.length > 0 && (
                          <div className="text-xs text-green-600 mt-2">
                            已解析 {parsedData.length} 行数据
                          </div>
                        )}
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
          </CardContent>
        </Card>

        {/* ===== 转换配置卡片 ===== */}
        {parsedData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>2. 配置转换选项</CardTitle>
              <CardDescription>
                选择原始文本列并设置默认值
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 列选择器 */}
              <div className="space-y-2">
                <Label>选择原始文本列</Label>
                <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择包含混合信息的列" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  选择包含标题、作者、链接、提取码等混合信息的列
                </p>
              </div>

              {/* 默认值设置 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 默认标签 */}
                <div className="space-y-2">
                  <Label>默认标签</Label>
                  <Input
                    value={defaultTags}
                    onChange={(e) => setDefaultTags(e.target.value)}
                    placeholder="例如: 推荐,精选"
                  />
                  <p className="text-xs text-gray-500">
                    多个标签用逗号分隔
                  </p>
                </div>

                {/* 默认语言 */}
                <div className="space-y-2">
                  <Label>默认语言</Label>
                  <Input
                    value={defaultLanguage}
                    onChange={(e) => setDefaultLanguage(e.target.value)}
                    placeholder="例如: 中文"
                  />
                </div>

                {/* 默认状态 */}
                <div className="space-y-2">
                  <Label>默认状态</Label>
                  <Input
                    value={defaultStatus}
                    onChange={(e) => setDefaultStatus(e.target.value)}
                    placeholder="例如: 完结"
                  />
                </div>
              </div>

              {/* 转换按钮 */}
              <Button
                onClick={handleConvert}
                disabled={!selectedColumn || isConverting}
                className="w-full"
              >
                {isConverting ? '转换中...' : '开始转换'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ===== 转换结果预览 ===== */}
        {convertedData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>3. 预览转换结果</CardTitle>
              <CardDescription>
                显示前 20 行转换后的数据（共 {convertedData.length} 行）
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 预览表格 */}
              <div className="border rounded-lg overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>标题</TableHead>
                      <TableHead>作者</TableHead>
                      <TableHead>标签</TableHead>
                      <TableHead>语言</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>链接</TableHead>
                      <TableHead>提取码</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {convertedData.slice(0, 20).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="max-w-xs truncate">{row.title}</TableCell>
                        <TableCell>{row.author || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{row.tags || '-'}</TableCell>
                        <TableCell>{row.language || '-'}</TableCell>
                        <TableCell>{row.status || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {row.url.substring(0, 30)}...
                          </a>
                        </TableCell>
                        <TableCell>{row.extract_code || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 下载按钮 */}
              <div className="mt-6 flex justify-end">
                <Button onClick={handleDownload} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  下载转换后的 CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== 转换说明卡片 ===== */}
        <Card>
          <CardHeader>
            <CardTitle>转换说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              {/* 字段提取规则 */}
              <div>
                <h3 className="font-semibold mb-2">字段提取规则：</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li><strong>URL：</strong>自动提取第一个 http:// 或 https:// 开头的链接</li>
                  <li><strong>提取码：</strong>匹配"提取码：xxxx"、"密码：xxxx"等格式</li>
                  <li><strong>作者：</strong>优先匹配 [作者名] 或 【作者名】，其次匹配"作品合集"中的作者</li>
                  <li><strong>标题：</strong>自动去除【漫画】、【动画】等前缀，清理链接和提取码信息</li>
                  <li><strong>标签：</strong>从文本中识别关键词（漫画、动画、小说等），并合并用户设置的默认标签</li>
                </ul>
              </div>

              {/* 目标格式 */}
              <div>
                <h3 className="font-semibold mb-2">目标标准格式：</h3>
                <p className="text-gray-600 mb-2">
                  转换后的 CSV 包含以下列：
                </p>
                <div className="bg-gray-100 p-3 rounded font-mono text-xs">
                  title, author, tags, language, status, url, extract_code, note, summary, alt_titles
                </div>
              </div>

              {/* 使用建议 */}
              <div>
                <h3 className="font-semibold mb-2">使用建议：</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>确保源 CSV 文件中至少有一列包含完整的原始信息</li>
                  <li>建议在默认值中填写通用的标签、语言和状态</li>
                  <li>转换后请检查预览结果，确认提取的字段是否正确</li>
                  <li>下载后的文件可直接在"CSV 导入"页面使用</li>
                  <li>如果某些字段未能正确提取，可在导入后手动编辑</li>
                </ol>
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
