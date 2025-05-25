"use client";

import { useState, useRef, TouchEvent } from 'react';
import OptimizedImage from '@/components/shared/OptimizedImage';

interface GalleryCardProps {
  images: string[]; // 这些URL已经由父组件处理过
  title: string;
  category?: { _id: string; name: string };
}

export default function GalleryCard({ images, title, category }: GalleryCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  
  // 确保images是数组且至少有一个元素
  const safeImages = Array.isArray(images) && images.length > 0 
    ? images 
    : ['/images/default.jpg'];
  
  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % safeImages.length);
  };
  
  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };

  // 处理触摸开始事件
  const handleTouchStart = (e: TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  // 处理触摸结束事件
  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartXRef.current === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    
    // 如果滑动距离足够大，切换图片
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // 向左滑动，下一张
        nextImage();
      } else {
        // 向右滑动，上一张
        prevImage();
      }
    }
    
    touchStartXRef.current = null;
  };

  return (
    <div 
      className="relative group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative overflow-hidden">
        <OptimizedImage 
          src={safeImages[currentIndex]} 
          alt={title}
          width={400}
          height={250}
          className="w-full transition-transform duration-300"
        />
        
        {/* 图片数量指示器 */}
        <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/20 shadow-lg flex items-center space-x-1.5 z-20">
          <i className="fas fa-images"></i>
          <span>{currentIndex + 1}/{safeImages.length}</span>
        </div>
        
        {/* 分类标签 */}
        {category && (
          <div className="absolute top-2.5 left-2.5 flex space-x-2 z-20">
            <span className="bg-primary/90 text-white px-3 py-1.5 text-xs font-medium rounded-full border border-white/20 shadow-md backdrop-blur-sm">
              {category.name}
            </span>
          </div>
        )}
        
        {safeImages.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <div className="px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full flex items-center space-x-2">
              {safeImages.map((_, index) => (
                <button 
                  key={index} 
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    index === currentIndex 
                      ? 'bg-white scale-125 shadow-[0_0_5px_rgba(255,255,255,0.8)]' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`查看第${index + 1}张图片`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 桌面端左右箭头导航 - 仅在非触摸设备上显示 */}
      {safeImages.length > 1 && (
        <>
          <button 
            onClick={prevImage} 
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/10"
            aria-label="上一张"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button 
            onClick={nextImage} 
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/10"
            aria-label="下一张"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </>
      )}
    </div>
  );
} 