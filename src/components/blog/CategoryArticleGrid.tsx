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
interface CategoryArticleGridProps {
  initialArticles: Article[];
  categoryId: string;
  categoryName: string;
  className?: string;
}

const ITEMS_PER_PAGE = 20; // 每页加载文章数量
const MAX_AUTO_LOADS = 2; // 最大自动加载次数

export default function CategoryArticleGrid({ 
  initialArticles, 
  categoryId,
  categoryName,
  className = '' 
}: CategoryArticleGridProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [autoLoadCount, setAutoLoadCount] = useState(0);
  const [reachedMax, setReachedMax] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 检查初始文章是否已达到最大限制
  useEffect(() => {
    if (initialArticles.length < ITEMS_PER_PAGE && !reachedMax) {
      setHasMore(false);
      setReachedMax(true);
    }
  }, [initialArticles.length, reachedMax]);

  // 加载更多文章
  const loadMoreArticles = useCallback(async () => {
    if (loading || reachedMax) return;

    try {
      setLoading(true);
      const nextPage = page + 1;
      // 使用API工具库获取更多文章
      const result = await publicGet(`/articles/category/${categoryId}?page=${nextPage}&limit=${ITEMS_PER_PAGE}`);

      if (result && Array.isArray(result.data)) {
        // 检查是否有新文章
        if (result.data.length > 0) {
          // 去重：过滤掉已经存在的文章
          const existingIds = new Set(articles.map(article => article._id));
          const newArticles = result.data.filter((article: Article) => !existingIds.has(article._id));
          
          if (newArticles.length > 0) {
            setArticles(prev => [...prev, ...newArticles]);
            setPage(nextPage);
          }
          
          // 判断是否还有更多数据
          const noMoreData = result.data.length < ITEMS_PER_PAGE || 
                           newArticles.length === 0 ||
                           result.pagination?.hasMore === false;
          
          if (noMoreData) {
            setHasMore(false);
            setReachedMax(true);
          }
        } else {
          // 没有返回新数据，表示已经到底了
          setHasMore(false);
          setReachedMax(true);
        }
      } else {
        // API返回格式异常
        setHasMore(false);
        setReachedMax(true);
      }
    } catch (error) {
      // 加载失败也需要更新状态，但给用户一个重试的机会
      setHasMore(true);
    } finally {
      setLoading(false);
    }
  }, [loading, page, categoryId, categoryName, articles]);

  // 处理滚动事件和自动加载
  useEffect(() => {
    // 创建观察器前判断是否需要自动加载
    if (!hasMore || reachedMax || loading || autoLoadCount >= MAX_AUTO_LOADS) {
      return; // 不需要创建观察器
    }

    // 创建观察器来监听加载更多元素

    // 创建观察器
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loading) {
          loadMoreArticles();
          setAutoLoadCount(prev => prev + 1);
        }
      },
      { 
        threshold: 0.1, 
        rootMargin: '200px' // 增大rootMargin提前触发
      }
    );

    // 确保元素存在后再观察
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    // 清理函数
    return () => {
      observer.disconnect();
    };
  }, [loadMoreArticles, hasMore, reachedMax, loading, autoLoadCount, articles.length]);

  // 如果没有文章显示空状态
  if (articles.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <i className="fas fa-folder-open text-4xl text-gray-400 mb-4"></i>
        <p className="text-lg text-gray-500">该分类下暂无文章</p>
        <p className="text-sm text-gray-400 mt-2">请稍后再来查看，或浏览其他分类</p>
        <div className="mt-6">
          <Link href="/" className="btn-primary">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-8 ${className}`}>
      <div className="pinterest-grid">
        {articles.map((article, index) => (
          <div key={`${article._id}-${index}`} className="pinterest-item text-sm bg-bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200">
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
                    <Link href={`/article/${article.slug}`}>
                      <OptimizedImage 
                        src={convertToApiImageUrl(article.featuredImage || article.coverImage || '')} 
                        alt={article.title}
                        width={400}
                        height={250}
                        className="w-full"
                        optimizeImage={true}
                        imageFormat="webp"
                        quality={85}
                      />
                    </Link>
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
                <h3 className="text-base font-bold text-primary mb-2">{article.title}</h3>
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
        {loading ? (
          // 加载中状态
          <div className="flex items-center justify-center py-4">
            <i className="fas fa-circle-notch fa-spin mr-2"></i>
            <span>加载中...</span>
          </div>
        ) : hasMore ? (
          // 可以加载更多
          autoLoadCount >= MAX_AUTO_LOADS ? (
            // 显示手动加载按钮
            <button 
              onClick={loadMoreArticles} 
              className="px-6 py-2 border border-gray-200 rounded-md text-text hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              加载更多
            </button>
          ) : (
            // 自动加载模式，显示提示
            <div className="py-4 text-sm text-gray-400">
              <i className="fas fa-angles-down fa-beat-fade mr-1"></i> 
              向下滚动加载更多
            </div>
          )
        ) : (
          // 没有更多文章
          <div className="text-center py-4 text-gray-500">
            <i className="fa-solid fa-paint-roller mr-2"></i>
            已经到底啦
          </div>
        )}
      </div>
    </div>
  );
} 