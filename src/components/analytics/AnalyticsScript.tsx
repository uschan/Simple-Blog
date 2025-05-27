'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function AnalyticsScript() {
  const [analyticsCode, setAnalyticsCode] = useState<string>('');
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
          },
          next: { revalidate: 0 } // 使用Next.js的fetch选项禁用缓存
        });
        
        if (!response.ok) {
          throw new Error(`获取统计代码失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // 直接使用analyticsCode字段
        if (data.success && data.data && data.data.analyticsCode) {
          console.log('获取到统计代码:', data.data.analyticsCode.substring(0, 50) + '...');
          console.log('统计代码类型:', typeof data.data.analyticsCode);
          
          // 设置统计代码
          setAnalyticsCode(data.data.analyticsCode);
          setError(null);
        } else {
          console.warn('API返回成功但无统计代码:', data);
          setError('无法获取统计代码数据');
        }
      } catch (error) {
        console.error('获取统计代码失败:', error);
        setError(error instanceof Error ? error.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);
  
  // 调试输出
  useEffect(() => {
    if (analyticsCode) {
      console.log(`[Analytics] 统计代码已加载, 长度: ${analyticsCode.length}`);
      
      // 检查代码中是否包含G-XXXXXXX或其他ID
      const googleMatch = analyticsCode.match(/id=G-[A-Z0-9]+/);
      if (googleMatch) {
        console.log(`[Analytics] 发现Google分析ID: ${googleMatch[0]}`);
      }
    }
  }, [analyticsCode]);
  
  if (loading || error || !analyticsCode) return null;
  
  // 使用Script组件渲染统计代码
  return (
    <Script
      id="analytics-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: analyticsCode }}
    />
  );
} 