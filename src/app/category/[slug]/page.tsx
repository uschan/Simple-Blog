import Image from 'next/image';
import OptimizedImage from '@/components/shared/OptimizedImage';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EmojiReaction from '@/components/blog/EmojiReaction';
import { getServerApiUrl } from '@/lib/constants';
import type { Metadata } from "next";
import { getSettings } from "@/lib/api/settings";
import { convertToApiImageUrl } from '@/lib/utils';
import dynamic from 'next/dynamic';

// 导入客户端动态组件
import { GalleryCard } from '@/components/client/DynamicComponents';
import ShareButton from '@/components/blog/ShareButton';

// 添加格式化函数
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 动态导入客户端组件
const CategoryArticleGrid = dynamic(() => import('@/components/blog/CategoryArticleGrid'), {
  ssr: true,
  loading: () => (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
});

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
    // console.log(`[分类页] 请求分类信息，slug: ${slug}`);
    
    // 使用getServerApiUrl获取完整URL
    const apiUrl = getServerApiUrl(`/api/categories/slug/${slug}`);
    // console.log(`[分类页] 请求API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      cache: 'no-store'
    });
    
    // console.log(`[分类页] 分类API响应状态: ${response.status}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // console.log(`[分类页] 分类不存在: ${slug}`);
        return null;
      }
      throw new Error(`获取分类失败: ${response.status}`);
    }
    
    const data = await response.json();
    // console.log(`[分类页] 分类API响应: `, data.success ? '成功' : '失败');
    
    if (!data.success || !data.data) {
      // console.log(`[分类页] 分类数据无效`);
      return null;
    }
    
    // console.log(`[分类页] 找到分类: ${data.data.name}`);
    return data.data;
  } catch (error) {
    console.error('[分类页] 获取分类错误:', error);
    return null;
  }
}

// 获取分类下的文章
async function getCategoryArticles(categoryId: string): Promise<Article[]> {
  try {
    // console.log(`[分类页] 请求分类文章，分类ID: ${categoryId}`);
    
    // 使用getServerApiUrl获取完整URL
    const apiUrl = getServerApiUrl(`/api/articles/category/${categoryId}`);
    // console.log(`[分类页] 请求文章API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      cache: 'no-store'
    });
    
    // console.log(`[分类页] 文章API响应状态: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`获取分类文章失败: ${response.status}`);
    }
    
    const data = await response.json();
    // console.log(`[分类页] 文章API响应: `, data.success ? '成功' : '失败');
    
    if (!data.success || !Array.isArray(data.data)) {
      console.error('[分类页] API未返回预期的文章数组:', data);
      return [];
    }
    
    // 确保每篇文章都有浏览量字段
    const articles = data.data.map((article: Article) => ({
      ...article,
      viewCount: article.viewCount || 0
    }));
    
    // 确保按照发布时间进行排序（最新的排在前面）
    const sortedArticles = [...articles].sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt).getTime();
      const dateB = new Date(b.publishedAt || b.createdAt).getTime();
      return dateB - dateA; // 降序排列，最新的在前
    });
    
    // console.log(`[分类页] 找到文章: ${sortedArticles.length}篇`);
    return sortedArticles;
  } catch (error) {
    console.error('[分类页] 获取分类文章错误:', error);
    return [];
  }
}

// 生成动态元数据
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  // 获取网站设置
  const settings = await getSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // 获取分类信息
  const category = await getCategory(slug);
  
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
      url: `${siteUrl}/category/${slug}`,
    },
    twitter: {
      card: 'summary',
      title: categoryName,
      description: categoryDescription,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    
    const category = await getCategory(slug);
    
    // 如果分类不存在，返回404页面
    if (!category) {
      // console.log(`[分类页] 分类不存在，显示404页面`);
      notFound();
    }
    
    // 获取该分类下的文章
    // console.log(`[分类页] 找到分类: ${category.name}，ID: ${category._id}`);
    const articles = await getCategoryArticles(category._id);
    
    return (
      <div className="container mx-auto p-4">
        {/* 文章列表 */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium underline underline-offset-8 decoration-wavy flex items-center">
              <i className="fa-solid fa-layer-group text-xl mr-3"></i>
              {category.name} · 文章列表
            </h2>
          </div>
          
          {/* 使用客户端组件来处理文章列表和加载更多功能 */}
          <CategoryArticleGrid 
            initialArticles={articles} 
            categoryId={category._id}
            categoryName={category.name}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error(`[分类页] 渲染失败:`, error);
    // 发生错误时也返回404
    notFound();
  }
} 