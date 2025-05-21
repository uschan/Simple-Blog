'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface Analytics {
  type: 'google' | 'umami';
  trackingCode: string;
}

export default function AnalyticsScript() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.analytics) {
            setAnalytics(data.data.analytics);
          }
        }
      } catch (error) {
        console.error('获取统计代码失败:', error);
      }
    };
    
    fetchAnalytics();
  }, []);
  
  if (!analytics) return null;
  
  // 根据统计类型不同处理方式
  if (analytics.type === 'google') {
    // Google Analytics 通常使用脚本引入
    const trackingId = analytics.trackingCode.match(/G-[A-Z0-9]+/)?.[0] || '';
    if (!trackingId) return null;
    
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${trackingId}');
          `}
        </Script>
      </>
    );
  } else if (analytics.type === 'umami') {
    // Umami 通常直接插入脚本
    const websiteId = analytics.trackingCode.match(/data-website-id="([^"]+)"/)?.[1] || '';
    const scriptSrc = analytics.trackingCode.match(/src="([^"]+)"/)?.[1] || '';
    
    if (!websiteId || !scriptSrc) return null;
    
    return (
      <Script
        src={scriptSrc}
        data-website-id={websiteId}
        strategy="afterInteractive"
      />
    );
  }
  
  return null;
} 