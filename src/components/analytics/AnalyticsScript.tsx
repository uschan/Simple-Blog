'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function AnalyticsScript() {
  const [analyticsCode, setAnalyticsCode] = useState<string>('');
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.analyticsCode) {
            setAnalyticsCode(data.data.analyticsCode);
          }
        }
      } catch (error) {
        console.error('获取统计代码失败:', error);
      }
    };
    
    fetchAnalytics();
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