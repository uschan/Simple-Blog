'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDailyNotice, updateDailyNotice } from '@/lib/api';

export default function NoticeManager() {
  const [notice, setNotice] = useState('');
  const [originalNotice, setOriginalNotice] = useState('');
  const [noticeDate, setNoticeDate] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const router = useRouter();
  
  // 初始化时加载当前公告
  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const response = await getDailyNotice();
        if (response.success && response.data) {
          setNotice(response.data.content);
          setOriginalNotice(response.data.content);
          setNoticeDate(response.data.date);
        }
      } catch (error) {
        console.error('获取公告失败:', error);
        setError('获取公告失败');
      }
    };
    
    fetchNotice();
  }, []);
  
  const handleNoticeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotice(e.target.value);
    setError('');
  };
  
  const handleSave = async () => {
    // 验证输入
    if (!notice.trim()) {
      setError('公告内容不能为空');
      return;
    }
    
    // 检查是否有更改
    if (notice === originalNotice) {
      setError('未做任何更改');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // 调用API保存数据
      const response = await updateDailyNotice(notice);
      
      if (!response.success) {
        throw new Error(response.error || '保存失败');
      }
      
      // 保存成功
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // 更新本地数据
      setOriginalNotice(notice);
      if (response.data && response.data.date) {
        setNoticeDate(response.data.date);
      }
      
      // 刷新路由数据
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : '保存过程中出错');
      console.error('保存错误:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4 mb-6">
        <h1 className="text-xl font-semibold underline underline-offset-8 decoration-wavy mb-6 flex items-center">
          <i className="fas fa-bullhorn text-primary mr-2"></i>/// 每日公告管理 ///
        </h1>
        
        <div className="mb-6">
          <h2 className="text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟当前公告◞</h2>
          <div className="p-4 bg-bg dark:bg-zinc-900 border border-gray-200 dark:border-0 rounded-lg mb-4">
            {noticeDate && (
              <div className="text-xs text-gray-500 mb-2">上次更新: {noticeDate}</div>
            )}
            <p className="text-gray-700 dark:text-gray-300 break-words">
              {originalNotice || '暂无公告'}
            </p>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟编辑公告◞</h2>
          <textarea 
            value={notice}
            onChange={handleNoticeChange}
            className="w-full h-40 p-3 border border-gray-100 dark:border-0 rounded-lg 
                     bg-bg dark:bg-zinc-900 text-sm"
            placeholder="输入新的公告内容..."
          />
          
          {error && (
            <p className="text-red-500 mt-2 text-sm">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              {error}
            </p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
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
            <strong>每日公告:</strong>
          </p>
          <ol className="text-xs italic list-decimal ml-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li>在上方文本框中编辑公告内容</li>
            <li>点击"保存更改"按钮更新公告</li>
            <li>更新后，访问者点击网站头像可以看到最新公告</li>
            <li>公告会显示在头像下方的弹出窗口中</li>
            <li>访问者点击页面任意位置可以关闭公告</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 