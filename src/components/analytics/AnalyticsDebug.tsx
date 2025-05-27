'use client';

import { useEffect, useState } from 'react';

export default function AnalyticsDebug() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // 添加时间戳和缓存控制头，确保每次都获取最新数据
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/settings?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`获取统计代码失败: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        setData(responseData);
      } catch (error) {
        console.error('获取统计代码失败:', error);
        setError(error instanceof Error ? error.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);
  
  // 只在管理员路径下显示
  if (!window.location.pathname.includes('/admin')) {
    return null;
  }
  
  if (loading) {
    return <div className="text-xs text-gray-500">加载统计信息...</div>;
  }
  
  if (error) {
    return <div className="text-xs text-red-500">错误: {error}</div>;
  }
  
  if (!data) {
    return <div className="text-xs text-red-500">无数据</div>;
  }
  
  // 提取信息
  const analyticsCode = data.data?.analyticsCode || '';
  const timestamp = data.timestamp || '';
  const googleId = analyticsCode.match(/['"](G-[A-Z0-9]+)['"]/)?.[1] || '';
  
  return (
    <div className="fixed bottom-0 right-0 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 p-2 text-xs shadow-md z-50 max-w-md">
      <h4 className="font-bold mb-1">统计代码调试 (仅管理员可见)</h4>
      <div className="mb-1">时间戳: {timestamp}</div>
      <div className="mb-1">统计ID: {googleId || '未检测到'}</div>
      <div className="mb-1">代码长度: {analyticsCode.length}</div>
      <div className="mb-1">
        代码预览: 
        <pre className="mt-1 p-1 bg-gray-100 dark:bg-zinc-900 rounded overflow-x-auto">
          {analyticsCode.length > 100 
            ? analyticsCode.substring(0, 100) + '...' 
            : analyticsCode || '无代码'}
        </pre>
      </div>
      <button 
        onClick={() => {
          // 强制重新获取统计代码
          window.location.reload();
        }}
        className="mt-1 px-2 py-1 bg-blue-500 text-white rounded text-xs"
      >
        强制刷新
      </button>
    </div>
  );
} 