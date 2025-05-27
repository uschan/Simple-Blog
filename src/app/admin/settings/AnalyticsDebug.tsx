'use client';

import { useState, useEffect } from 'react';
import { get } from '@/lib/api';

export default function AnalyticsDebug() {
  const [analyticsCode, setAnalyticsCode] = useState<string>('');
  const [googleId, setGoogleId] = useState<string>('');
  const [umamiId, setUmamiId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // 添加时间戳和缓存控制，避免缓存问题
        const timestamp = new Date().getTime();
        const response = await get(`/api/settings?t=${timestamp}`);
        
        if (response.success && response.data) {
          const analyticsCode = response.data.analytics?.trackingCode || '';
          setAnalyticsCode(analyticsCode);
          
          // 提取Google Analytics ID
          const googleMatch = analyticsCode.match(/['"](G-[A-Z0-9]+)['"]/);
          if (googleMatch && googleMatch[1]) {
            setGoogleId(googleMatch[1]);
          }
          
          // 提取Umami ID
          const umamiMatch = analyticsCode.match(/data-website-id="([^"]+)"/);
          if (umamiMatch && umamiMatch[1]) {
            setUmamiId(umamiMatch[1]);
          }
        } else {
          setError('获取统计代码失败');
        }
      } catch (err) {
        setError('加载设置时出错');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  if (loading) {
    return <div className="text-sm text-gray-500">加载统计代码信息...</div>;
  }
  
  if (error) {
    return <div className="text-sm text-red-500">错误: {error}</div>;
  }
  
  if (!analyticsCode) {
    return <div className="text-sm text-orange-500">未配置统计代码</div>;
  }
  
  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium mb-2">统计代码状态</h3>
      
      <div className="space-y-2 text-xs">
        {googleId ? (
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>Google Analytics ID: {googleId}</span>
          </div>
        ) : (
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            <span>未检测到Google Analytics ID</span>
          </div>
        )}
        
        {umamiId ? (
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>Umami Website ID: {umamiId}</span>
          </div>
        ) : (
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            <span>未检测到Umami Website ID</span>
          </div>
        )}
        
        <div>
          <p className="mb-1">代码预览:</p>
          <pre className="p-2 bg-gray-100 dark:bg-zinc-800 rounded overflow-x-auto max-h-32 text-[10px]">
            {analyticsCode || '无代码'}
          </pre>
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={() => window.location.reload()}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            刷新
          </button>
        </div>
      </div>
    </div>
  );
} 