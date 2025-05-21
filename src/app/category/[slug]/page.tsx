import Image from 'next/image';
import OptimizedImage from '@/components/shared/OptimizedImage';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import EmojiReaction from '@/components/blog/EmojiReaction';
import { getServerApiUrl } from '@/lib/constants';
import type { Metadata } from "next";
import { getSettings } from "@/lib/api/settings";

// 动态导入客户端组件，避免服务器渲染错误
const GalleryCard = dynamic(() => import('@/components/blog/GalleryCard'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] bg-gray-200 animate-pulse flex items-center justify-center">
      <i className="fas fa-images text-gray-400 text-3xl"></i>
    </div>
  )
});

// 添加格式化函数
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

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
  description?: string;
  isFeatured?: boolean;
}

// 获取分类信息
async function getCategory(slug: string): Promise<Category | null> {
  try {
    console.log(`[分类页] 请求分类信息，slug: ${slug}`);
    
    // 使用getServerApiUrl获取完整URL
    const apiUrl = getServerApiUrl(`/api/categories/slug/${slug}`);
    console.log(`[分类页] 请求API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      cache: 'no-store'
    });
    
    console.log(`[分类页] 分类API响应状态: ${response.status}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[分类页] 分类不存在: ${slug}`);
        return null;
      }
      throw new Error(`获取分类失败: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[分类页] 分类API响应: `, data.success ? '成功' : '失败');
    
    if (!data.success || !data.data) {
      console.log(`[分类页] 分类数据无效`);
      return null;
    }
    
    console.log(`[分类页] 找到分类: ${data.data.name}`);
    return data.data;
  } catch (error) {
    console.error('[分类页] 获取分类错误:', error);
    return null;
  }
}

// 获取分类下的文章
async function getCategoryArticles(categoryId: string): Promise<Article[]> {
  try {
    console.log(`[分类页] 请求分类文章，分类ID: ${categoryId}`);
    
    // 使用getServerApiUrl获取完整URL
    const apiUrl = getServerApiUrl(`/api/articles/category/${categoryId}`);
    console.log(`[分类页] 请求文章API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      cache: 'no-store'
    });
    
    console.log(`[分类页] 文章API响应状态: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`获取分类文章失败: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[分类页] 文章API响应: `, data.success ? '成功' : '失败');
    
    if (!data.success || !Array.isArray(data.data)) {
      console.error('[分类页] API未返回预期的文章数组:', data);
      return [];
    }
    
    console.log(`[分类页] 找到文章: ${data.data.length}篇`);
    return data.data;
  } catch (error) {
    console.error('[分类页] 获取分类文章错误:', error);
    return [];
  }
}

// 生成动态元数据
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // 获取网站设置
  const settings = await getSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // 获取分类信息
  const category = await getCategory(params.slug);
  
  // 如果分类不存在，返回默认元数据
  if (!category) {
    return {
      title: `分类未找到 | ${settings.siteName}`,
      description: settings.siteDescription,
    };
  }
  
  // 获取分类名称和描述
  const categoryName = category.name;
  const categoryDescription = category.description || `查看 ${categoryName} 分类的最新文章和资讯`;
  
  return {
    title: categoryName,
    description: categoryDescription,
    openGraph: {
      title: categoryName,
      description: categoryDescription,
      type: 'website',
      url: `${siteUrl}/category/${params.slug}`,
    },
    twitter: {
      card: 'summary',
      title: categoryName,
      description: categoryDescription,
    },
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  try {
    console.log(`[分类页] 渲染分类页面，slug参数: ${params.slug}`);
    
    const category = await getCategory(params.slug);
    
    // 如果分类不存在，返回404页面
    if (!category) {
      console.log(`[分类页] 分类不存在，显示404页面`);
      notFound();
    }
    
    // 获取该分类下的文章
    console.log(`[分类页] 找到分类: ${category.name}，ID: ${category._id}`);
    const articles = await getCategoryArticles(category._id);
    
    return (
      <div className="container mx-auto p-4">
        {/* 文章列表 */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium underline underline-offset-8 decoration-wavy flex items-center">
              <i className="fa-solid fa-layer-group text-xl mr-3"></i>
              {category.name} · 文章列表
            </h2>
          </div>
          
          {articles.length === 0 ? (
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
          ) : (
            <div className="pinterest-grid">
              {articles.map((article: Article) => (
                <div key={article._id} className="pinterest-item text-sm bg-bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                  <div className="relative">
                    {/* 根据coverType显示不同类型的媒体 */}
                    {article.coverType === 'video' ? (
                      // 视频类型
                      <div className="relative">
                        <video 
                          src={article.videoUrl || article.coverVideo || ''} 
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
                          article.galleryImages?.length ? article.galleryImages :
                          article.coverGallery?.length ? article.coverGallery :
                          [article.featuredImage || article.coverImage || '/images/default.jpg']
                        }
                        title={article.title}
                        category={article.categories?.length ? article.categories[0] : undefined}
                      />
                    ) : (
                      // 默认单图类型
                      <div className="relative">
                        <OptimizedImage 
                          src={article.featuredImage || article.coverImage || '/images/default.jpg'} 
                          alt={article.title}
                          width={400}
                          height={250}
                          className="w-full"
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
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <i className="fa-solid fa-user-astronaut mr-1"></i>
                      <span className="text-xs text-text-light">
                        {article.authorName || '匿名'} | {formatDate(article.publishedAt || article.createdAt)}
                      </span>
                    </div>
                    <Link href={`/article/${article.slug}`}>
                      <h3 className="text-lg font-normal text-primary mb-2">{article.title}</h3>
                    </Link>
                    <p className="text-text-light mb-4">{article.excerpt || article.summary}</p>
                    <div className="border-t border-gray-200 my-4"></div>
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
                        <div>
                          <i className="fa-solid fa-share-nodes"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {articles.length > 0 && articles.length > 8 && (
            <div className="flex justify-center mt-8">
              <button className="px-6 py-2 border border-gray-200 rounded-md text-text hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                加载更多
              </button>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error(`[分类页] 渲染失败:`, error);
    // 发生错误时也返回404
    notFound();
  }
} 