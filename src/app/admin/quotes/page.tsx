'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import shareQuotesData from '@/data/shareQuotes.json';

export default function QuotesManager() {
  const [quotes, setQuotes] = useState<typeof shareQuotesData.quotes>([]);
  const [jsonError, setJsonError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingJson, setEditingJson] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const router = useRouter();
  
  useEffect(() => {
    // 初始化时加载默认数据
    setQuotes(shareQuotesData.quotes);
    setEditingJson(JSON.stringify({ quotes: shareQuotesData.quotes, lastUpdated: new Date().toISOString().split('T')[0] }, null, 2));
  }, []);
  
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingJson(e.target.value);
    setJsonError('');
    
    // 验证JSON格式
    try {
      const parsed = JSON.parse(e.target.value);
      if (!parsed.quotes || !Array.isArray(parsed.quotes)) {
        setJsonError('JSON必须包含quotes数组');
      }
    } catch (error) {
      setJsonError('无效的JSON格式');
    }
  };
  
  const handleSave = async () => {
    try {
      const parsed = JSON.parse(editingJson);
      
      // 简单验证
      if (!parsed.quotes || !Array.isArray(parsed.quotes)) {
        setJsonError('JSON必须包含quotes数组');
        return;
      }
      
      setIsSaving(true);
      
      // 调用API保存数据
      const response = await fetch('/api/quotes/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsed),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '保存失败');
      }
      
      // 保存成功
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // 更新本地数据
      setQuotes(parsed.quotes);
      
      // 刷新路由数据
      router.refresh();
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : '保存过程中出错');
      console.error('保存错误:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4 mb-6">
        <h1 className="text-xl font-semibold underline underline-offset-8 decoration-wavy mb-6 flex items-center">
          <i className="fas fa-quote-left text-primary mr-2"></i>/// 分享语录管理 ///</h1>
        
        <div className="mb-8">
          <h2 className="text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟当前语录 ({quotes.length})◞</h2>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 overflow-y-auto p-4 bg-bg dark:bg-zinc-900 border border-gray-200 dark:border-0 rounded-lg">
            {quotes.map((quote, index) => (
              <div key={quote.id} className="text-xs p-3 bg-gray-100 dark:bg-zinc-800 rounded">
                <p className="text-gray-700 dark:text-gray-300 italic">"{quote.text}"</p>
                <p className="text-right text-gray-500 dark:text-gray-400 mt-1">—— {quote.author}</p>
              </div>
            ))}
            {quotes.length === 0 && (
              <p className="text-center py-4 text-gray-500">暂无语录数据</p>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟编辑JSON数据◞</h2>
          <p className="text-xs italic text-gray-600 dark:text-gray-400 mb-2">
            直接编辑JSON格式的语录数据，修改后点击保存按钮。请确保JSON格式正确。
          </p>
          
          <textarea 
            value={editingJson}
            onChange={handleJsonChange}
            className="w-full h-80 p-3  border border-gray-100 dark:border-0 rounded-lg 
                     bg-bg dark:bg-zinc-900 font-mono text-xs italic"
          />
          
          {jsonError && (
            <p className="text-red-500 mt-2 text-sm">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              {jsonError}
            </p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!!jsonError || isSaving}
            className="px-4 py-2 bg-primary text-sm text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                保存中...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                保存更改
              </>
            )}
          </button>
          
          {saveSuccess && (
            <div className="ml-4 px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
              <i className="fas fa-check-circle mr-1"></i>
              保存成功
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4">        
          <h3 className="text-xl font-semibold underline underline-offset-8 decoration-wavy mb-4">/// 使用说明 ///</h3>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg text-sm">
            <p className="mb-2 text-yellow-800 dark:text-yellow-200">
              <i className="fas fa-info-circle mr-1"></i>
              <strong>如何修改语录:</strong>
            </p>
            <ol className="text-xs italic list-decimal ml-5 space-y-1 text-gray-700 dark:text-gray-300">
              <li>在上方文本框中编辑JSON数据</li>
              <li>确保每条语录包含<code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">id</code>、<code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">text</code>和<code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">author</code>字段</li>
              <li>点击"保存更改"按钮</li>
              <li>保存后，分享弹窗将随机显示这些语录</li>
            </ol>
          </div>
      </div>
    </div>
  );
} 