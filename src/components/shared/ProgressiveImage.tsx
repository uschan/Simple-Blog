'use client';

import { useState, useEffect } from 'react';
import OptimizedImage from './OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/utils';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
}

/**
 * 渐进式加载图片组件
 * 先显示低质量小图，再加载高质量大图
 */
export default function ProgressiveImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  priority = false,
  sizes,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // 生成低质量的缩略图URL
  const thumbnailSrc = !src.startsWith('http') ? getOptimizedImageUrl(src, {
    width: width ? Math.min(width, 20) : 20,
    quality: 30,
    format: 'webp'
  }) : src;
  
  // 高质量图片URL
  const fullSrc = !src.startsWith('http') ? getOptimizedImageUrl(src, {
    width: width,
    quality: 80,
    format: 'webp'
  }) : src;
  
  useEffect(() => {
    // 重置加载状态当源图片变化时
    setIsLoaded(false);
  }, [src]);
  
  return (
    <div className="relative overflow-hidden" style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '100%' }}>
      {/* 低质量模糊图片 - 总是显示 */}
      <div className={`absolute inset-0 ${isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        style={{ filter: 'blur(10px)', transform: 'scale(1.1)' }}
      >
        <OptimizedImage
          src={thumbnailSrc}
          alt={alt}
          fill={true}
          className={className}
          sizes={sizes || "100vw"}
          priority={true} // 优先加载缩略图
          quality={30}
        />
      </div>
      
      {/* 高质量图片 - 加载完成后显示 */}
      <div className={`absolute inset-0 ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
        <OptimizedImage
          src={fullSrc}
          alt={alt}
          fill={true}
          className={className}
          sizes={sizes}
          priority={priority}
          quality={80}
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    </div>
  );
} 