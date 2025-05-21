import { Article, Category } from '@/models';
import connectDB from '@/lib/db';
import { MetadataRoute } from 'next';

// 创建站点地图
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await connectDB();
    
    // 获取所有发布的文章
    const articles = await Article.find({ status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .select('slug publishedAt updatedAt')
      .lean();
    
    // 获取所有分类
    const categories = await Category.find()
      .select('slug updatedAt')
      .lean();
    
    // 网站基本URL - 使用环境变量或本地开发URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // 静态页面
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: `${siteUrl}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${siteUrl}/api/rss`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }
    ];
    
    // 文章页面
    const articlePages = articles.map(article => {
      return {
        url: `${siteUrl}/article/${article.slug}`,
        lastModified: article.updatedAt || article.publishedAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });
    
    // 分类页面
    const categoryPages = categories.map(category => {
      return {
        url: `${siteUrl}/category/${category.slug}`,
        lastModified: category.updatedAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      };
    });
    
    // 合并所有页面
    return [...staticPages, ...categoryPages, ...articlePages];
  } catch (error) {
    console.error('生成站点地图失败:', error);
    
    // 发生错误时返回基本站点地图
    return [
      {
        url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      }
    ];
  }
} 