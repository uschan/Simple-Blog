'use client';

import { useEffect, useState, useRef } from 'react';
import OptimizedImage from './OptimizedImage';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
  placeholderSrc?: string;
  threshold?: number; // 0-1之间的值，表示可见度阈值
}

/**
 * 延迟加载图片组件
 * 只有当图片进入可视区域时才开始加载
 */
export default function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  sizes,
  placeholderSrc = '/images/image-placeholder.svg',
  threshold = 0.1, // 默认10%可见时加载
}: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!window.IntersectionObserver) {
      // 如果浏览器不支持IntersectionObserver，则始终显示图片
      setIsVisible(true);
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          // 图片可见后取消观察
          if (imgRef.current) {
            observer.unobserve(imgRef.current);
          }
        }
      },
      {
        root: null, // 使用视口作为根
        rootMargin: '200px', // 预加载区域
        threshold: threshold, // 可见度阈值
      }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [threshold]);
  
  return (
    <div 
      ref={imgRef}
      className="relative overflow-hidden" 
      style={{ 
        width: width ? `${width}px` : '100%', 
        height: height ? `${height}px` : '100%' 
      }}
    >
      {/* 占位图 */}
      <div className={`absolute inset-0 ${isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        <OptimizedImage
          src={placeholderSrc}
          alt="placeholder"
          fill={true}
          className={className}
          sizes={sizes || "100vw"}
          unoptimized={true}
        />
      </div>
      
      {/* 实际图片 - 只有当可见时才加载 */}
      {isVisible && (
        <div className={`absolute inset-0 ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <OptimizedImage
            src={src}
            alt={alt}
            fill={fill}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            className={className}
            sizes={sizes}
            onLoad={() => setIsLoaded(true)}
          />
        </div>
      )}
    </div>
  );
} 