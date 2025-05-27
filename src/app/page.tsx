export const dynamic = 'force-dynamic';
import Image from 'next/image';
import OptimizedImage from '@/components/shared/OptimizedImage';
import Link from 'next/link';
import ArticleCard from '@/components/blog/ArticleCard';
import EmojiReaction from '@/components/blog/EmojiReaction';
import ShareButton from '@/components/blog/ShareButton'; // 导入分享按钮组件
// 移除原来的动态导入
// import DynamicClientOnly from 'next/dynamic';
import { getServerApiUrl } from '@/lib/constants';
import { serverFetch } from '@/lib/api'; // 导入服务端API工具
import { convertToApiImageUrl } from '@/lib/utils'; // 导入URL转换工具

// 导入客户端动态组件
import { GalleryCard, HeroSlider } from '@/components/client/DynamicComponents';

// 导入分页文章组件
import ArticleGrid from '@/components/blog/ArticleGrid';

// 文章类型定义
interface Article {
  _id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  summary?: string;
  featuredImage?: string;
  galleryImages?: string[];
  videoUrl?: string;
  publishedAt?: string;
  createdAt: string;
  categories?: Array<Category>;
  authorName?: string;
  viewCount?: number;
  likes?: number;
  status?: 'published' | 'draft';
  coverType?: 'image' | 'gallery' | 'video';
  coverImage?: string;
  coverGallery?: string[];
  coverVideo?: string;
  isSlider?: boolean;
  isFeatured?: boolean;
}

// 分类类型定义
interface Category {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  isFeatured?: boolean;
}

// 添加格式化函数
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 获取最新文章数据 - 用于瀑布流初始数据
async function getLatestArticles(): Promise<Article[]> {
  try {
    // 使用serverFetch获取最新文章，第一页，20篇
    const data = await serverFetch('/api/articles/page?page=1&limit=20', {
      cache: 'no-store'
    });
    
    if (!data.success || !Array.isArray(data.data)) {
      console.error('API未返回预期的最新文章数组:', data);
      return [];
    }
    
    // console.log(`成功获取${data.data.length}篇最新文章`);
    return data.data;
  } catch (error) {
    console.error('获取最新文章错误:', error);
    return [];
  }
}

// 获取分类数据
async function getCategories(): Promise<Category[]> {
  try {
    // 使用serverFetch保持与原始逻辑一致
    const data = await serverFetch('/api/categories', {
      cache: 'no-store'
    });
    
    if (!data.success || !Array.isArray(data.data)) {
      console.error('API未返回预期的分类数组:', data);
      return [];
    }
    
    return data.data;
  } catch (error) {
    console.error('获取分类错误:', error);
    return [];
  }
}

// 获取轮播图文章数据
async function getSliderArticles(): Promise<Article[]> {
  try {
    // 使用serverFetch获取轮播图文章
    const data = await serverFetch('/api/articles/slider?limit=3', {
      cache: 'no-store'
    });
    
    if (!data.success || !Array.isArray(data.data)) {
      console.error('API未返回预期的轮播图文章数组:', data);
      return [];
    }
    
    // console.log(`成功获取${data.data.length}篇轮播图文章`);
    return data.data;
  } catch (error) {
    console.error('获取轮播图文章错误:', error);
    return [];
  }
}

// 获取特色文章数据
async function getFeaturedArticles(): Promise<Article[]> {
  try {
    // 使用serverFetch获取特色文章
    const data = await serverFetch('/api/articles/featured?limit=4', {
      cache: 'no-store'
    });
    
    if (!data.success || !Array.isArray(data.data)) {
      console.error('API未返回预期的特色文章数组:', data);
      return [];
    }
    
    // console.log(`成功获取${data.data.length}篇特色文章`);
    return data.data;
  } catch (error) {
    console.error('获取特色文章错误:', error);
    return [];
  }
}

export default async function Home() {
  // 获取最新文章
  const apiArticles = await getLatestArticles();
  // console.log(`首页渲染${apiArticles.length}篇最新文章`);
  
  // 直接获取轮播图文章
  const sliderArticles = await getSliderArticles();
  
  // 直接获取特色文章
  const featuredApiArticles = await getFeaturedArticles();
  
  // 获取分类数据
  const categories = await getCategories();
  
  // 筛选推荐分类，如果没有足够的推荐分类，则补充其他分类，最多显示4个
  const featuredCategories = [...categories]
    .sort((a, b) => {
      // 首先按推荐排序
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      // 其次按排序字段排序（如果存在）
      if ('order' in a && 'order' in b) {
        //@ts-ignore
        return a.order - b.order;
      }
      return 0;
    })
    .slice(0, 6);
  
  // 确保文章数据正确且有必要字段
  apiArticles.forEach((article, index) => {
    if (!article._id || !article.title) {
      console.warn(`第${index}篇文章数据不完整:`, article);
    }
  });

  return (
    <div className="container mx-auto p-4">
      {/* 顶部轮播区域 */}
      <div className="mb-4">
        <HeroSlider articles={sliderArticles} />
      </div>

      {/* 特色文章区域 */}
      <div className="mb-4">
        <h2 className="px-4 py-2 text-lg font-medium underline underline-offset-8 decoration-sky-500 decoration-wavy rounded-lg mb-4 flex items-center">
        <i className="fa-regular fa-face-kiss-wink-heart text-3xl text-sky-500 mr-3"></i>
          推荐阅读
        </h2>
        {featuredApiArticles.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">暂无特色文章</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {featuredApiArticles.map(article => (
              <div key={article._id} className="text-sm bg-bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200">
              <div className="relative">
                  {/* 固定比例的图片容器 */}
                  <div className="relative h-[220px]" style={{ position: 'relative' }}>
                    <Link href={`/article/${article.slug}`}>
                    <OptimizedImage 
                      src={article.featuredImage || article.coverImage 
                        ? convertToApiImageUrl(article.featuredImage || article.coverImage || '') 
                        : '/images/default.jpg'} 
                      alt={article.title}
                      fill
                      className="object-cover"
                      optimizeImage={true}
                      imageFormat="webp"
                      quality={85}
                    />
                    </Link>
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
                  <p className="text-text-light mb-4">{article.excerpt || article.summary || ''}</p>
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
        )}
        </div>
        
      {/* 分类区域 */}
      <div className="mb-4">
        <h2 className="px-4 py-2 text-lg font-medium underline underline-offset-8 decoration-green-500 decoration-wavy rounded-lg mb-4 flex items-center">
        <i className="fa-regular fa-face-grin-squint-tears text-3xl text-green-500 mr-3 "></i>
        探索分类
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {featuredCategories.length > 0 ? (
            featuredCategories.map((category, index) => (
              <Link 
                key={category._id} 
                href={`/category/${category.slug || category.name.toLowerCase()}`}
                className="relative h-24 rounded-lg overflow-hidden group"
              >
                <OptimizedImage 
                  src={category.image ? convertToApiImageUrl(category.image) : `/images/${index + 7}.jpg`}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  optimizeImage={true}
                  imageFormat="webp"
                  quality={85}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-medium">{category.name}</h3>
                </div>
                {category.isFeatured && (
                  <div className="absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-full">
                    <i className="fas fa-star mr-1"></i>推荐
                  </div>
                )}
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500">暂无分类信息</p>
            </div>
          )}
        </div>
      </div>

      {/* 瀑布流布局区域 */}
      <div className="mb-8">
        <h2 className="px-4 py-2 text-lg font-medium underline underline-offset-8 decoration-red-500 decoration-wavy rounded-lg mb-4 flex items-center">
        <i className="fa-regular fa-face-dizzy text-3xl text-red-500 mr-3"></i>
          最新文章
        </h2>
        
        {apiArticles.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">暂无文章内容</p>
          </div>
        ) : (
          <ArticleGrid initialArticles={apiArticles} />
        )}
      </div>
    </div>
  );
} 