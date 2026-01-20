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
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

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
const STORAGE_KEY = 'article_grid_state'; // 本地存储键名

export default function ArticleGrid({ initialArticles, className = '' }: ArticleGridProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [autoLoadCount, setAutoLoadCount] = useState(0);
  const [reachedMax, setReachedMax] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  // 滚动位置恢复相关状态
  const [lastViewedArticleId, setLastViewedArticleId] = useState<string | null>(null);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  
  // 使用useState以确保客户端hydration后才更新布局
  const [hydrated, setHydrated] = useState(false);
  // 添加窗口宽度状态
  const [windowWidth, setWindowWidth] = useState(0);
  
  // 检查初始文章是否已达到最大限制
  useEffect(() => {
    if (initialArticles.length < ITEMS_PER_PAGE && !reachedMax) {
      setHasMore(false);
      setReachedMax(true);
    }
  }, [initialArticles.length, reachedMax]);

  // 添加CSS样式
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .masonry-grid {
        display: flex;
        width: 100%;
        margin: 0 auto;
      }
      
      .masonry-column {
        display: flex;
        flex-direction: column;
        padding-left: 5px;
        padding-right: 5px;
        box-sizing: border-box;
      }
      
      /* 第一列没有左边距 */
      .masonry-column:first-child {
        padding-left: 0;
      }
      
      /* 最后一列没有右边距 */
      .masonry-column:last-child {
        padding-right: 0;
      }
      
      .pinterest-item {
        margin-bottom: 20px;
        break-inside: avoid;
        width: 100%;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .pinterest-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
      }
      
      /* 加载动画 */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .pinterest-item {
        animation: fadeIn 0.5s ease;
      }
      
      /* 移动端适配 */
      @media (max-width: 640px) {
        .masonry-column {
          padding-left: 0;
          padding-right: 0;
        }
        
        .pinterest-item {
          margin-bottom: 15px;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 恢复会话状态
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = sessionStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const state = JSON.parse(savedState);
          // 如果路径匹配且有保存的文章数据
          if (state.pathname === pathname && state.articles?.length) {
            setArticles(state.articles);
            setPage(state.page || 1);
            setLastViewedArticleId(state.lastViewedArticleId);
            setLastScrollPosition(state.scrollY || 0);
            
            // 清除状态
            sessionStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error('恢复状态出错:', e);
      }
    }
  }, [pathname]);

  // 保存状态以便返回时恢复
  const saveStateBeforeNavigation = useCallback((articleId: string) => {
    if (typeof window !== 'undefined') {
      try {
        const state = {
          articles,
          page,
          pathname,
          lastViewedArticleId: articleId,
          scrollY: window.scrollY
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('保存状态出错:', e);
      }
    }
  }, [articles, page, pathname]);

  // 恢复滚动位置
  useEffect(() => {
    if (lastScrollPosition > 0) {
      setTimeout(() => {
        window.scrollTo({
          top: lastScrollPosition,
          behavior: 'instant'
        });
        setLastScrollPosition(0);
      }, 100);
    }
  }, [lastScrollPosition]);

  // 服务端渲染和客户端hydration处理
  useEffect(() => {
    // 标记客户端已hydrated
    setHydrated(true);
    
    // 初始化窗口宽度
    setWindowWidth(window.innerWidth);
    
    // 监听窗口大小变化
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // 添加resize事件监听，使用节流函数减少触发频率
    let resizeTimer: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', throttledResize);
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // 根据屏幕宽度确定列数
  const getColumnCount = () => {
    // 在服务端渲染时使用固定列数
    if (typeof window === 'undefined' || windowWidth === 0) return 3; // 默认列数
    
    if (windowWidth < 640) return 1; // 移动设备
    if (windowWidth < 768) return 2; // 小屏设备
    if (windowWidth < 1024) return 3; // 平板
    if (windowWidth < 1280) return 4; // 小桌面
    if (windowWidth < 1536) return 5; // 小桌面
    if (windowWidth < 1920) return 5; // 小桌面
    return 6; // 大屏设备
  };

  // 创建简单的瀑布流布局 - 基于列的简单实现
  const createMasonryLayout = useCallback(() => {
    // 将文章复制一份
    const articleList = [...articles];
    
    // 固定列数，避免服务端和客户端不一致
    const columns = getColumnCount();
    
    // 创建列数组
    const columnItems: Article[][] = Array.from({ length: columns }, () => []);
    
    // 将文章分配到各列 - 蛇形排列以确保行优先
    articleList.forEach((article, index) => {
      const columnIndex = index % columns;
      columnItems[columnIndex].push(article);
    });
    
    return columnItems;
  }, [articles, windowWidth]); // 添加windowWidth依赖，使列数随窗口宽度变化而更新

  // 加载更多文章
  const loadMoreArticles = useCallback(async () => {
    if (loading || reachedMax) return;

    try {
      setLoading(true);
      const nextPage = page + 1;
      // console.log('加载更多文章, 页码:', nextPage);

      // 使用API工具库获取更多文章
      const result = await publicGet(`/articles/page?page=${nextPage}&limit=${ITEMS_PER_PAGE}`);
      // console.log('API返回结果:', result);

      if (result && Array.isArray(result.data)) {
        // 检查是否有新文章并去重
        if (result.data.length > 0) {
          // 去重：过滤掉已经存在的文章
          const existingIds = new Set(articles.map(article => article._id));
          const newArticles = result.data.filter((article: Article) => !existingIds.has(article._id));
          
          // console.log(`获取到${result.data.length}篇文章，过滤重复后剩余${newArticles.length}篇`);
          
          if (newArticles.length > 0) {
            setArticles(prev => [...prev, ...newArticles]);
          setPage(nextPage);
            // console.log(`已加载${newArticles.length}篇新文章`);
        }

          // 检查是否还有更多数据 - 只有明确为false时才设置为没有更多
          const hasMoreData = result.pagination?.hasMore !== false && newArticles.length > 0;
          setHasMore(hasMoreData);
          // console.log('是否有更多数据:', hasMoreData);

        // 检查是否达到最大限制
          if (result.pagination?.hasMore === false || newArticles.length === 0) {
            // console.log('已达到最大限制，没有更多数据');
            setReachedMax(true);
          }
        } else {
          // 没有返回新数据，表示已经到底了
          // console.log('没有获取到新文章，已到底');
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

    // 创建观察器来监听加载更多元素
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

  // 渲染文章卡片的函数
  const renderArticleCard = (article: Article, index: number) => {
  return (
      <div 
        key={`${article._id}-${index}`} 
        className="pinterest-item text-sm bg-bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200"
      >
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
                <Link href={`/article/${article.slug}`} onClick={() => saveStateBeforeNavigation(article._id)}>
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
          <Link href={`/article/${article.slug}`} onClick={() => saveStateBeforeNavigation(article._id)}>
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
    );
  };

  // 客户端hydration后的列宽计算
  const columnItems = createMasonryLayout();
  const columnWidth = 100 / columnItems.length;

  // 根据列数计算实际列间距
  const getColumnGap = () => {
    // 移动端单列布局，无间距
    if (windowWidth < 640) return 0;
    // 平板和桌面，根据列数调整间距
    return `10px`;
  };

  return (
    <div className={`mb-8 ${className}`}>
      <div 
        ref={containerRef} 
        className="masonry-grid"
        style={{ gap: hydrated ? getColumnGap() : '10px' }}
      >
        {/* 服务端渲染时使用固定的3列布局 */}
        {!hydrated ? (
          // 服务端渲染固定列数
          Array.from({ length: 3 }, (_, columnIndex) => (
            <div 
              key={`column-${columnIndex}`} 
              className="masonry-column"
              style={{ 
                width: '33.333%',
                paddingLeft: columnIndex === 0 ? 0 : '10px',
                paddingRight: columnIndex === 2 ? 0 : '10px'
              }}
            >
              {articles
                .filter((_, index) => index % 3 === columnIndex)
                .map((article, articleIndex) => 
                  renderArticleCard(article, articleIndex)
                )}
            </div>
          ))
        ) : (
          // 客户端渲染后使用动态列数
          columnItems.map((column, columnIndex) => (
            <div 
              key={`column-${columnIndex}`} 
              className="masonry-column"
              style={{ 
                width: `${columnWidth}%`,
                paddingLeft: columnIndex === 0 ? 0 : undefined,
                paddingRight: columnIndex === columnItems.length - 1 ? 0 : undefined
              }}
            >
              {column.map((article, articleIndex) => 
                renderArticleCard(article, articleIndex)
              )}
            </div>
          ))
        )}
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