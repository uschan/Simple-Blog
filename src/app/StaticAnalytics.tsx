'use client';

import { useEffect } from 'react';

export default function StaticAnalytics() {
  useEffect(() => {
    // 立即加载统计代码
    const loadAnalyticsCode = async () => {
      try {
        // 添加时间戳和随机数以防缓存
        const timestamp = new Date().getTime();
        const random = Math.random().toString(36).substring(2, 15);
        const response = await fetch(`/api/settings?t=${timestamp}&r=${random}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`获取统计代码失败，状态码: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.data || !data.data.analyticsCode) {
          console.warn('没有找到有效的统计代码');
          return;
        }
        
        // 从响应中获取统计代码
        const codeStr = data.data.analyticsCode;
        console.log('获取到统计代码', codeStr.substring(0, 50) + '...');
        
        // 解码HTML实体
        const decoded = decodeHtmlEntities(codeStr);
        
        // 直接创建一个div并添加到body
        const container = document.createElement('div');
        container.id = 'analytics-static-container';
        container.innerHTML = decoded;
        document.body.appendChild(container);
        
        // 手动处理脚本标签
        const scripts = container.getElementsByTagName('script');
        const scriptArray = Array.from(scripts);
        
        scriptArray.forEach(oldScript => {
          const newScript = document.createElement('script');
          
          // 复制属性
          Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          
          // 复制内容
          newScript.textContent = oldScript.textContent;
          
          // 如果有src，清空内容
          if (oldScript.src) {
            newScript.textContent = '';
          }
          
          // 替换原始脚本
          if (oldScript.parentNode) {
            oldScript.parentNode.replaceChild(newScript, oldScript);
          }
        });
        
        console.log('统计代码已成功加载');
      } catch (error) {
        console.error('加载统计代码出错:', error);
      }
    };
    
    // 解码HTML实体的辅助函数
    function decodeHtmlEntities(str: string): string {
      if (!str) return '';
      
      // 替换转义序列
      return str
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\')
        .replace(/\\u003c/g, '<')
        .replace(/\\u003e/g, '>')
        .replace(/\\u0022/g, '"')
        .replace(/\\u0027/g, "'")
        .replace(/\\u0026/g, '&');
    }
    
    // 调用加载函数
    loadAnalyticsCode();
    
    // 5秒后重试一次
    const retryTimer = setTimeout(() => {
      console.log('尝试重新加载统计代码...');
      loadAnalyticsCode();
    }, 5000);
    
    // 清理函数
    return () => {
      clearTimeout(retryTimer);
      // 移除容器
      const container = document.getElementById('analytics-static-container');
      if (container) {
        container.remove();
      }
    };
  }, []);
  
  // 不渲染任何可见内容
  return null;
} 