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

// 客户端导入Masonry库
let Masonry: any;
let imagesLoaded: any;

// 日期格式化函数，确保客户端和服务器端格式一致
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 动态导入画廊组件
const GalleryCard = dynamic(() => import('./GalleryCard'), {
  ssr: false,
  loading: () => (
    <div className="w-full bg-gray-200 animate-pulse flex items-center justify-center" style={{minHeight: "150px"}}>
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
  const gridRef = useRef<HTMLDivElement>(null);
  const masonryInstance = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  // 客户端导入库
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
      // 动态导入 (仅在客户端)
      import('masonry-layout').then((module) => {
        Masonry = module.default;
      });
      import('imagesloaded').then((module) => {
        imagesLoaded = module.default;
      });
    }
  }, []);

  // 初始化Masonry布局
  const initMasonry = useCallback(() => {
    if (!isClient || !gridRef.current || !Masonry || !imagesLoaded) return;

    // 销毁旧的实例
    if (masonryInstance.current) {
      masonryInstance.current.destroy();
    }

    // 等待图片加载完成
    imagesLoaded(gridRef.current, () => {
      // 创建新的Masonry实例
      masonryInstance.current = new Masonry(gridRef.current!, {
        itemSelector: '.grid-item',
        columnWidth: '.grid-sizer',
        percentPosition: true,
        horizontalOrder: true, // 确保水平方向排序
        gutter: 0,
        initLayout: true,
        transitionDuration: 0 // 禁用动画以提高性能
      });

      console.log('Masonry初始化完成');
    });
  }, [isClient]);

  // 当文章变化时，更新Masonry布局
  useEffect(() => {
    if (isClient) {
      const timer = setTimeout(() => {
        initMasonry();
      }, 500); // 延迟初始化，确保图片有时间加载
      
      return () => {
        clearTimeout(timer);
        // 组件卸载时销毁Masonry实例
        if (masonryInstance.current) {
          masonryInstance.current.destroy();
        }
      };
    }
  }, [articles, initMasonry, isClient]);

  // 加载更多文章
  const loadMoreArticles = useCallback(async () => {
    if (loading || reachedMax) return;

    try {
      setLoading(true);
      const nextPage = page + 1;
      console.log('加载更多文章, 页码:', nextPage);

      // 使用API工具库获取更多文章
      const result = await publicGet(`/articles/page?page=${nextPage}&limit=${ITEMS_PER_PAGE}`);
      console.log('API返回结果:', result);

      if (result && Array.isArray(result.data)) {
        // 检查是否有新文章并去重
        if (result.data.length > 0) {
          // 去重：过滤掉已经存在的文章
          const existingIds = new Set(articles.map(article => article._id));
          const newArticles = result.data.filter((article: Article) => !existingIds.has(article._id));
          
          console.log(`获取到${result.data.length}篇文章，过滤重复后剩余${newArticles.length}篇`);
          
          if (newArticles.length > 0) {
            setArticles(prev => [...prev, ...newArticles]);
            setPage(nextPage);
            console.log(`已加载${newArticles.length}篇新文章`);
          }

          // 检查是否还有更多数据 - 只有明确为false时才设置为没有更多
          const hasMoreData = result.pagination?.hasMore !== false && newArticles.length > 0;
          setHasMore(hasMoreData);
          console.log('是否有更多数据:', hasMoreData);

          // 检查是否达到最大限制
          if (result.pagination?.hasMore === false || newArticles.length === 0) {
            console.log('已达到最大限制，没有更多数据');
            setReachedMax(true);
          }
        } else {
          // 没有返回新数据，表示已经到底了
          console.log('没有获取到新文章，已到底');
          setHasMore(false);
          setReachedMax(true);
        }
      } else {
        // API返回异常处理
        console.error('API返回格式异常:', result);
        // 不立即设置hasMore为false，给后续加载机会
        if (page > 3) { // 多尝试几页后再放弃
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('加载更多文章失败:', error);
      // 出错后不立即放弃，给用户重试机会
      if (page > 3) { // 多次失败后再停止尝试
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, reachedMax, articles]);

  // 处理滚动事件和自动加载
  useEffect(() => {
    // 创建观察器前判断是否需要自动加载
    if (!hasMore || reachedMax || loading || autoLoadCount >= MAX_AUTO_LOADS) {
      return; // 不需要创建观察器
    }

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
  }, [loadMoreArticles, hasMore, reachedMax, loading, autoLoadCount]);

  // 检查初始文章是否已达到最大限制
  useEffect(() => {
    if (initialArticles.length < ITEMS_PER_PAGE && !reachedMax) {
      setHasMore(false);
      setReachedMax(true);
    }
  }, [initialArticles.length, reachedMax]);

  return (
    <div className={`mb-8 ${className}`}>
      <div className="masonry-container" ref={gridRef}>
        {/* 网格尺寸元素 */}
        <div className="grid-sizer"></div>
        
        {articles.map((article, index) => (
          <div 
            key={`${article._id}-${index}`} 
            className="grid-item"
          >
            <div className="article-card text-sm bg-bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200">
              <div className="relative">
                {/* 根据coverType显示不同类型的媒体 */}
                {article.coverType === 'video' ? (
                  // 视频类型
                  <div className="relative">
                    <video 
                      src={convertToApiImageUrl(article.videoUrl || article.coverVideo || '')} 
                      preload="metadata"
                      controls
                      className="w-full object-cover bg-gray-100"
                    />
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
                          width={800}
                          height={0}
                          style={{ width: '100%', height: 'auto' }}
                          className="w-full"
                          optimizeImage={true}
                          imageFormat="webp"
                          quality={85}
                        />
                      </Link>
                    ) : (
                      <div className="w-full bg-gray-200 flex items-center justify-center" style={{minHeight: "150px"}}>
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
              
              <div className="px-4 py-2 flex-grow flex flex-col">
                <Link href={`/article/${article.slug}`} className="mb-2">
                  <h3 className="text-base font-bold text-primary">{article.title}</h3>
                </Link>                
                <div className="flex items-center mb-2">
                  <i className="fa-solid fa-user-astronaut mr-1"></i>
                  <span className="text-xs text-text-light">
                    {article.authorName || '匿名'} | {formatDate(article.publishedAt || article.createdAt)}
                  </span>
                </div>

                <p className="text-text-light mb-2">{article.excerpt || article.summary}</p>
                <div className="mt-auto">
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