'use client';

import { useEffect, useState, useRef } from 'react';
import Script from 'next/script';

// 解码HTML实体的辅助函数
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  
  // 创建一个临时DOM元素来解码HTML
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  const decoded = txt.value;
  
  // 替换常见转义序列
  return decoded
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
}

export default function AnalyticsScript() {
  const [analyticsCode, setAnalyticsCode] = useState<string>('');
  const [decodedCode, setDecodedCode] = useState<string>('');
  const [useHtmlFallback, setUseHtmlFallback] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
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
            const code = data.data.analyticsCode;
            console.log('获取到统计代码(原始):', code.substring(0, 50) + '...');
            setAnalyticsCode(code);
            
            // 解码HTML实体
            if (typeof window !== 'undefined') {
              const decoded = decodeHtmlEntities(code);
              console.log('解码后的统计代码:', decoded.substring(0, 50) + '...');
              setDecodedCode(decoded);
            }
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
  
  // 直接使用innerHTML注入统计代码的备选方案
  useEffect(() => {
    if (!useHtmlFallback || !containerRef.current || !decodedCode) return;
    
    try {
      // 清空容器，防止重复注入
      containerRef.current.innerHTML = '';
      
      // 创建DOM并插入代码
      const div = document.createElement('div');
      div.innerHTML = decodedCode;
      
      // 处理脚本标签
      const scripts = div.getElementsByTagName('script');
      const scriptArray = Array.from(scripts);
      
      // 将内容先添加到容器
      containerRef.current.appendChild(div);
      
      // 手动创建并执行脚本
      scriptArray.forEach(oldScript => {
        const newScript = document.createElement('script');
        
        // 复制所有属性
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // 复制内联代码
        newScript.textContent = oldScript.textContent;
        
        // 如果有src属性，不设置内容
        if (oldScript.src) {
          newScript.textContent = '';
        }
        
        // 替换原脚本
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
      
      console.log('使用HTML fallback方式加载了统计代码');
    } catch (error) {
      console.error('HTML fallback加载统计代码失败:', error);
    }
  }, [useHtmlFallback, decodedCode]);

  // 处理Script组件加载失败的情况
  const handleScriptError = () => {
    console.warn('Script组件加载失败，切换到HTML fallback方式');
    setUseHtmlFallback(true);
  };
  
  if (!decodedCode && !analyticsCode) return null;
  
  // 优先使用解码后的代码，如果没有则使用原始代码
  const finalCode = decodedCode || analyticsCode;
  
  return (
    <>
      {!useHtmlFallback && (
        <Script
          id="analytics-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: finalCode }}
          onError={handleScriptError}
        />
      )}
      <div ref={containerRef} id="analytics-fallback-container" />
    </>
  );
} 