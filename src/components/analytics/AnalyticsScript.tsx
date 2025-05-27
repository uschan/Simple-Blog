'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function AnalyticsScript() {
  const [analyticsCode, setAnalyticsCode] = useState<string>('');
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // 添加时间戳和随机数参数，防止缓存
        const timestamp = new Date().getTime();
        const random = Math.random().toString(36).substring(2, 15);
        const response = await fetch(`/api/settings?t=${timestamp}&r=${random}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.analyticsCode) {
            console.log('获取到统计代码', data.data.analyticsCode.substring(0, 50) + '...');
            setAnalyticsCode(data.data.analyticsCode);
          } else {
            console.warn('没有找到统计代码或格式不正确', data);
          }
        } else {
          console.error('获取统计代码失败, 状态码:', response.status);
        }
      } catch (error) {
        console.error('获取统计代码失败:', error);
      }
    };
    
    fetchAnalytics();
    
    // 添加一个5秒后的重试机制，确保代码加载
    const retryTimer = setTimeout(() => {
      if (!analyticsCode) {
        console.log('重试获取统计代码...');
        fetchAnalytics();
      }
    }, 5000);
    
    return () => clearTimeout(retryTimer);
  }, []);
  
  if (!analyticsCode) return null;
  
  // 使用Script组件渲染统计代码
  return (
    <Script
      id="analytics-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: analyticsCode }}
    />
  );
} 