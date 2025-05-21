export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Article } from '@/models';
import connectDB from '@/lib/db';

// 分页获取文章API
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 获取分页参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20'); // 默认每页20篇
    const status = url.searchParams.get('status') || 'published';
    
    // 最大限制，防止过度获取
    const MAX_LIMIT = 50;
    const MAX_TOTAL = 200; // 最多允许获取的文章总数
    
    // 计算当前请求可以获取的最大数量
    const currentMaxAllowed = Math.min(MAX_TOTAL - ((page - 1) * limit), MAX_LIMIT);
    const safeLimit = Math.min(limit, currentMaxAllowed);
    
    // 如果超出最大限制，直接返回空数组
    if (currentMaxAllowed <= 0) {
      return NextResponse.json({
        success: true,
        message: '已达到最大获取数量限制',
        data: [],
        pagination: {
          page,
          limit: safeLimit,
          hasMore: false,
          total: MAX_TOTAL
        }
      });
    }
    
    // 计算跳过的数量
    const skip = (page - 1) * safeLimit;
    
    // 添加随机延时（200-500ms），仅在非首页时
    if (page > 1) {
      const delay = Math.floor(Math.random() * 300) + 200;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // 构建查询条件
    const query = { status };
    
    // 查询文章总数
    const total = await Article.countDocuments(query);
    
    // 查询当前页的文章
    const articles = await Article.find(query)
      .populate('categories', 'name slug')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();
    
    // 转换数据，确保客户端期望的字段名
    const transformedArticles = articles.map(article => ({
      _id: (article._id as any).toString(),
      title: article.title,
      slug: article.slug,
      excerpt: article.summary || '',
      summary: article.summary || '',
      viewCount: article.views || 0,
      likes: article.likes || 0,
      comments: article.comments || 0,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      authorName: article.authorName,
      categories: article.categories,
      coverType: article.coverType || 'image',
      coverImage: article.coverImage || '',
      featuredImage: article.coverImage || '',
      coverGallery: article.coverGallery || [],
      coverVideo: article.coverVideo || '',
      status: article.status,
      isSlider: article.isSlider || false,
      isFeatured: article.isFeatured || false
    }));
    
    // 计算是否还有更多数据
    const totalFetched = skip + transformedArticles.length;
    const hasMore = totalFetched < Math.min(total, MAX_TOTAL);
    
    // 返回分页数据
    return NextResponse.json({
      success: true,
      data: transformedArticles,
      pagination: {
        page,
        limit: safeLimit,
        hasMore,
        total: Math.min(total, MAX_TOTAL)
      }
    });
    
  } catch (error: any) {
    console.error('[分页API] 获取文章错误:', error);
    return NextResponse.json({
      success: false,
      message: error.message || '获取文章失败'
    }, { status: 500 });
  }
} 