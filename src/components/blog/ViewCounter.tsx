'use client';

import { useState, useEffect } from 'react';

interface ViewCounterProps {
  articleId: string;
  initialCount?: number;
  showCount?: boolean;
  className?: string;
}

export default function ViewCounter({ 
  articleId, 
  initialCount = 0, 
  showCount = true,
  className = ''
}: ViewCounterProps) {
  const [viewCount, setViewCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // 组件加载时记录访问量
  useEffect(() => {
    // 如果已经加载过，不要重复记录
    if (isLoaded) return;
    
    const recordView = async () => {
      try {
        if (!articleId) {
          console.error('缺少文章ID');
          setIsLoading(false);
          return;
        }
        
        const response = await fetch('/api/views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ articleId }),
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            setViewCount(data.viewCount || 0);
          } else {
            console.error('记录访问量失败:', data.error || '未知错误');
          }
        } else {
          console.error('API请求失败:', response.status);
        }
      } catch (error) {
        console.error('记录访问量时出错:', error);
      } finally {
        setIsLoading(false);
        setIsLoaded(true);
      }
    };
    
    // 延迟1秒记录浏览量，确保用户实际在浏览页面
    const timer = setTimeout(() => {
      recordView();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [articleId, isLoaded]);
  
  if (!showCount) {
    return null;
  }

  return (
    <div className={`flex items-center ${className}`}>
      <i className="fa-solid fa-eye mr-1"></i>
      <span>
        {isLoading ? '...' : viewCount}
      </span>
    </div>
  );
} 