"use client";

import { useState, useEffect, useRef, TouchEvent } from 'react';
import Image from 'next/image';
import OptimizedImage from '@/components/shared/OptimizedImage';
import Link from 'next/link';
import { convertToApiImageUrl } from '@/lib/utils';

interface Category {
  _id: string;
  name: string;
}

interface Article {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  summary?: string;
  featuredImage?: string;
  coverImage?: string;
  publishedAt?: string;
  createdAt: string;
  categories?: Category[];
  authorName?: string;
  isSlider?: boolean;
}

interface HeroSliderProps {
  articles: Article[];
}

// 添加格式化函数
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function HeroSlider({ articles }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  
  // 确保文章数组至少有一个元素
  const safeArticles = articles.length > 0 ? articles : [];
  
  // 组件挂载后设置已加载状态
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  // 手动切换到下一张
  const nextSlide = () => {
    if (safeArticles.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % safeArticles.length);
  };
  
  // 手动切换到上一张
  const prevSlide = () => {
    if (safeArticles.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + safeArticles.length) % safeArticles.length);
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
        nextSlide();
      } else {
        // 向右滑动，上一张
        prevSlide();
      }
    }
    
    touchStartXRef.current = null;
  };
  
  if (safeArticles.length === 0) {
    return (
      <div className="relative w-full h-96 bg-gradient-to-b from-gray-300 to-gray-500 rounded-lg overflow-hidden flex items-center justify-center">
        <p className="text-white text-xl">暂无轮播文章</p>
      </div>
    );
  }
  
  const currentArticle = safeArticles[currentIndex];
  
  return (
    <div 
      className="relative w-full h-96 bg-gradient-to-b from-gray-300 to-gray-500 rounded-lg overflow-hidden group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 文章图片 */}
      <div className="relative h-full overflow-hidden">
        {(currentArticle.featuredImage || currentArticle.coverImage) ? (
          <Link href={`/article/${currentArticle.slug}`}>
            <OptimizedImage
              src={convertToApiImageUrl(currentArticle.featuredImage || currentArticle.coverImage || '')}
              alt={currentArticle.title}
              fill
              className="object-cover transition-transform duration-300"
              priority
              onLoad={() => setIsLoaded(true)}
              optimizeImage={true}
              imageFormat="webp"
              quality={85}
            />
          </Link>
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-600 flex items-center justify-center">
            <i className="fas fa-image text-white text-4xl"></i>
          </div>
        )}
      </div>
      
      {/* 内容叠加层 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
        <div className="flex gap-2 mb-2">
          {currentArticle.categories?.map(cat => (
            <span key={cat._id} className="bg-primary/90 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 shadow-md backdrop-blur-sm">
              {cat.name}
            </span>
          ))}
        </div>
        
        <Link href={`/article/${currentArticle.slug}`} className="group">
          <h2 className="text-white text-2xl md:text-3xl font-medium mb-2 transition-colors">
            {currentArticle.title}
          </h2>
        </Link>
        
        <p className="text-white/80 mb-4 max-w-2xl">
          {currentArticle.excerpt || currentArticle.summary}
        </p>
      </div>
      
      {/* 图片数量指示器 */}
      {isLoaded && safeArticles.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/20 shadow-lg flex items-center space-x-1.5 z-20">
          <i className="fas fa-images"></i>
          <span>{currentIndex + 1}/{safeArticles.length}</span>
        </div>
      )}
      
      {/* 轮播指示器 - 只在加载完成后显示 */}
      {isLoaded && safeArticles.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full flex items-center space-x-2">
            {safeArticles.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  idx === currentIndex 
                    ? 'bg-white scale-125 shadow-[0_0_5px_rgba(255,255,255,0.8)]' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`查看第${idx + 1}篇文章`}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* 左右箭头 - 只在加载完成后显示 */}
      {isLoaded && safeArticles.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/10"
            aria-label="上一篇"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/10"
            aria-label="下一篇"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </>
      )}
    </div>
  );
} 