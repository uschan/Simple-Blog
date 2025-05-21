"use client";

import { useState, useEffect, useRef } from 'react';
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
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null);
  
  // 确保文章数组至少有一个元素
  const safeArticles = articles.length > 0 ? articles : [];
  
  // 组件挂载和图片加载完成后显示内容
  useEffect(() => {
    setIsLoaded(true);
    
    return () => {
      if (autoplayTimer.current) {
        clearInterval(autoplayTimer.current);
      }
    };
  }, []);
  
  // 自动轮播 - 只在页面可见和组件加载完成时启动
  useEffect(() => {
    if (safeArticles.length <= 1 || !isLoaded) return;
    
    // 当页面可见时启动轮播，不可见时暂停
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (autoplayTimer.current) {
          clearInterval(autoplayTimer.current);
          autoplayTimer.current = null;
        }
      } else {
        startAutoplay();
      }
    };
    
    const startAutoplay = () => {
      if (autoplayTimer.current) {
        clearInterval(autoplayTimer.current);
      }
      
      autoplayTimer.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % safeArticles.length);
      }, 5000); // 5秒切换一次
    };
    
    // 初始启动
    startAutoplay();
    
    // 添加页面可见性监听
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (autoplayTimer.current) {
        clearInterval(autoplayTimer.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [safeArticles.length, isLoaded]);
  
  // 手动切换到下一张
  const nextSlide = () => {
    if (safeArticles.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % safeArticles.length);
    
    // 重置自动播放计时器
    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current);
      autoplayTimer.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % safeArticles.length);
      }, 5000);
    }
  };
  
  // 手动切换到上一张
  const prevSlide = () => {
    if (safeArticles.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + safeArticles.length) % safeArticles.length);
    
    // 重置自动播放计时器
    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current);
      autoplayTimer.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % safeArticles.length);
      }, 5000);
    }
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
    <div className="relative w-full h-96 bg-gradient-to-b from-gray-300 to-gray-500 rounded-lg overflow-hidden group">
      {/* 文章图片 */}
      {(currentArticle.featuredImage || currentArticle.coverImage) ? (
        <OptimizedImage
          src={convertToApiImageUrl(currentArticle.featuredImage || currentArticle.coverImage || '')}
          alt={currentArticle.title}
          fill
          className="object-cover"
          priority
          onLoad={() => setIsLoaded(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-600 flex items-center justify-center">
          <i className="fas fa-image text-white text-4xl"></i>
        </div>
      )}
      
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
          <h2 className="text-white text-2xl md:text-3xl font-bold mb-2 group-hover:text-primary-light transition-colors">
            {currentArticle.title}
          </h2>
        </Link>
        
        <p className="text-white/80 mb-4 max-w-2xl">
          {currentArticle.excerpt || currentArticle.summary}
        </p>
        
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-600 mr-2 flex items-center justify-center text-white">
            <i className="fas fa-user"></i>
          </div>
          <div>
            <p className="text-white text-sm font-medium">{currentArticle.authorName || '匿名'}</p>
            <p className="text-white/70 text-xs">
              {formatDate(currentArticle.publishedAt || currentArticle.createdAt)}
            </p>
          </div>
        </div>
      </div>
      
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