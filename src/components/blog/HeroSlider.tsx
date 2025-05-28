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

// 文章卡片组件 - 用于渲染单个文章
const ArticleCard = ({ article, className = '' }: { article: Article, className?: string }) => {
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {/* 文章图片 */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        {(article.featuredImage || article.coverImage) ? (
          <Link href={`/article/${article.slug}`}>
            <OptimizedImage
              src={convertToApiImageUrl(article.featuredImage || article.coverImage || '')}
              alt={article.title}
              width={1200}
              height={675}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              imageFormat="webp"
              quality={90}
            />
          </Link>
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-600 flex items-center justify-center">
            <i className="fa-solid fa-hotdog text-white text-4xl"></i>
          </div>
        )}
      </div>
      
      {/* 内容叠加层 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3 sm:p-4 lg:p-5">
        <div className="flex flex-wrap gap-2 mb-2">
          {article.categories?.map(cat => (
            <span key={cat._id} className="bg-primary/90 text-white text-xs px-2 py-1 rounded-full border border-white/20 shadow-md backdrop-blur-sm">
              {cat.name}
            </span>
          ))}
        </div>
        
        <Link href={`/article/${article.slug}`} className="mb-12 group">
          <h2 className="text-white text-lg sm:text-xl lg:text-2xl font-medium mb-1 line-clamp-2 transition-colors">
            {article.title}
          </h2>
        </Link>
      </div>
    </div>
  );
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
      <div className="relative w-full h-auto rounded-lg overflow-hidden flex items-center justify-center py-20">
        <p className="text-white text-xl">暂无轮播文章</p>
      </div>
    );
  }
  
  const currentArticle = safeArticles[currentIndex];
  // 获取下一个要显示的文章索引（用于双联模式）
  const nextArticleIndex = (currentIndex + 1) % safeArticles.length;
  
  return (
    <div 
      className="relative w-full h-auto rounded-lg overflow-hidden group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 响应式轮播 - 移动端单联，电脑端双联 */}
      <div className="block lg:hidden">
        {/* 移动端单联轮播 */}
        <ArticleCard article={currentArticle} />
      </div>
      
      <div className="hidden lg:flex lg:flex-row space-x-4">
        {/* 电脑端双联轮播 */}
        <ArticleCard article={currentArticle} className="w-[calc(50%-8px)]" />
        {safeArticles.length > 1 && (
          <ArticleCard article={safeArticles[nextArticleIndex]} className="w-[calc(50%-8px)]" />
        )}
      </div>
      
      {/* 图片数量指示器 - 只在移动端显示 */}
      {isLoaded && safeArticles.length > 1 && (
        <div className="lg:hidden absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/20 shadow-lg flex items-center space-x-1.5 z-20">
          <i className="fa-solid fa-fire"></i>
          <span>{currentIndex + 1}/{safeArticles.length}</span>
        </div>
      )}
      
      {/* 轮播指示器 - 只在加载完成后和移动端显示 */}
      {isLoaded && safeArticles.length > 1 && (
        <div className="lg:hidden absolute bottom-4 left-0 right-0 flex justify-center">
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
      
      {/* 左右箭头 - 只在加载完成后显示，在电脑端和移动端都显示，但电脑端切换两张 */}
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