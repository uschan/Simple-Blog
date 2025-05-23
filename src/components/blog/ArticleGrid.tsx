'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import OptimizedImage from '@/components/shared/OptimizedImage';
import Link from 'next/link';
import EmojiReaction from './EmojiReaction';
import dynamic from 'next/dynamic';
import ShareButton from './ShareButton';
import { publicGet } from '@/lib/api'; // 导入API工具库
import { convertToApiImageUrl } from '@/lib/utils';

// 日期格式化函数，确保客户端和服务器端格式一致
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 动态导入画廊组件
const GalleryCard = dynamic(() => import('./GalleryCard'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] bg-gray-200 animate-pulse flex items-center justify-center">
      <i className="fas fa-images text-gray-400 text-3xl"></i>
    </div>
  )
});

// 文章和分类接口
interface Category {
  _id: string;
  name: string;
  slug?: string;
}

interface Article {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  summary?: string;
  featuredImage?: string;
  publishedAt?: string;
  createdAt: string;
  categories?: Array<Category>;
  authorName?: string;
  viewCount?: number;
  likes?: number;
  coverType?: 'image' | 'gallery' | 'video';
  coverImage?: string;
  coverGallery?: string[];
  coverVideo?: string;
  galleryImages?: string[];
  videoUrl?: string;
}

// 组件props接口
interface ArticleGridProps {
  initialArticles: Article[];
  className?: string;
}

const ITEMS_PER_PAGE = 20; // 每页加载文章数量
const MAX_AUTO_LOADS = 2; // 最大自动加载次数

export default function ArticleGrid({ initialArticles, className = '' }: ArticleGridProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [autoLoadCount, setAutoLoadCount] = useState(0);
  const [reachedMax, setReachedMax] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);

  // 加载更多文章
  const loadMoreArticles = useCallback(async () => {
    if (loading || !hasMore || reachedMax) return;

    try {
      setLoading(true);
      const nextPage = page + 1;

      // 使用API工具库获取更多文章
      const result = await publicGet(`/articles/page?page=${nextPage}&limit=${ITEMS_PER_PAGE}`);

      if (result.success && Array.isArray(result.data)) {
        if (result.data.length > 0) {
          setArticles(prev => [...prev, ...result.data]);
          setPage(nextPage);
        }

        // 检查是否还有更多数据
        setHasMore(result.pagination?.hasMore || false);

        // 检查是否达到最大限制
        if (!result.pagination?.hasMore || result.data.length === 0) {
          setReachedMax(true);
        }
      } else {
        // 出错或没有更多数据
        setHasMore(false);
      }
    } catch (error) {
      console.error('加载更多文章失败:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, reachedMax]);

  // 处理滚动事件
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && autoLoadCount < MAX_AUTO_LOADS && !loading) {
          loadMoreArticles();
          setAutoLoadCount(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loadMoreArticles, hasMore, autoLoadCount, loading]);

  return (
    <div className={`mb-8 ${className}`}>
      <div className="pinterest-grid">
        {articles.map((article) => (
          <div key={article._id} className="pinterest-item text-sm bg-bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <div className="relative">
              {/* 根据coverType显示不同类型的媒体 */}
              {article.coverType === 'video' ? (
                // 视频类型
                <div className="relative">
                  <video 
                    src={convertToApiImageUrl(article.videoUrl || article.coverVideo || '')} 
                    preload="metadata"
                    controls
                    className="w-full h-[250px] object-cover bg-gray-100"
                  />
                  {/* 视频标识 */}
                  <div className="absolute bottom-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                    <i className="fas fa-video mr-1"></i>
                    视频
                  </div>
                  {/* 分类标签 */}
                  <div className="absolute top-2.5 left-2.5 flex space-x-2 z-20">
                    {article.categories?.length ? (
                      article.categories.map((cat: Category) => (
                        <span key={cat._id} className="bg-primary/90 text-white px-3 py-1.5 text-xs font-medium rounded-full border border-white/20 shadow-md backdrop-blur-sm">
                          {cat.name}
                        </span>
                      ))
                    ) : null}
                  </div>
                </div>
              ) : article.coverType === 'gallery' ? (
                // 多图类型 - 使用轮播组件
                <GalleryCard 
                  images={
                    article.galleryImages?.length ? article.galleryImages.map(img => convertToApiImageUrl(img)) :
                    article.coverGallery?.length ? article.coverGallery.map(img => convertToApiImageUrl(img)) :
                    article.featuredImage || article.coverImage ? [convertToApiImageUrl(article.featuredImage || article.coverImage || '')] : []
                  }
                  title={article.title}
                  category={article.categories?.length ? article.categories[0] : undefined}
                />
              ) : (
                // 默认单图类型
                <div className="relative">
                  {article.featuredImage || article.coverImage ? (
                    <OptimizedImage 
                      src={convertToApiImageUrl(article.featuredImage || article.coverImage || '')} 
                      alt={article.title}
                      width={400}
                      height={250}
                      className="w-full"
                    />
                  ) : (
                    <div className="w-full h-[250px] bg-gray-200 flex items-center justify-center">
                      <i className="fas fa-file-alt text-gray-400 text-3xl"></i>
                    </div>
                  )}
                  {/* 分类标签 */}
                  <div className="absolute top-2.5 left-2.5 flex space-x-2 z-20">
                    {article.categories?.length ? (
                      article.categories.map((cat: Category) => (
                        <span key={cat._id} className="bg-primary/90 text-white px-3 py-1.5 text-xs font-medium rounded-full border border-white/20 shadow-md backdrop-blur-sm">
                          {cat.name}
                        </span>
                      ))
                    ) : null}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-4 py-2">

              <Link href={`/article/${article.slug}`}>
                <h3 className="text-xl font-normal text-primary mb-2">{article.title}</h3>
              </Link>                
              <div className="flex items-center mb-2">
                <i className="fa-solid fa-user-astronaut mr-1"></i>
                <span className="text-xs text-text-light">
                  {article.authorName || '匿名'} | {formatDate(article.publishedAt || article.createdAt)}
                </span>
              </div>

              <p className="text-text-light mb-2">{article.excerpt || article.summary}</p>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <EmojiReaction 
                    article={{
                      id: article._id,
                      reactionCount: article.likes || 0,
                      userReaction: 'like'
                    }}
                  />
                </div>
                <div className="flex items-center text-sm text-text-light space-x-4">
                  <div className="flex items-center">
                    <i className="fa-solid fa-eye mr-1"></i>
                    <span>{article.viewCount || 0}</span>
                  </div>
                  <ShareButton 
                    url={`/article/${article.slug}`} 
                    title={article.title}
                    summary={article.excerpt || article.summary || ''}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 加载更多区域 */}
      <div ref={loadMoreRef} className="flex justify-center mt-8">
        {hasMore ? (
          autoLoadCount >= MAX_AUTO_LOADS ? (
            <button 
              onClick={loadMoreArticles} 
              disabled={loading}
              className="px-6 py-2 border border-gray-200 rounded-md text-text hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          ) : (
            <div className="py-4">
              {loading && (
                <div className="flex items-center justify-center">
                  <i className="fas fa-circle-notch fa-spin mr-2"></i>
                  <span>加载中...</span>
                </div>
              )}
            </div>
          )
        ) : (
          articles.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              <i className="fa-solid fa-paint-roller mr-2"></i>
              已经到底啦
            </div>
          )
        )}
      </div>
    </div>
  );
} 