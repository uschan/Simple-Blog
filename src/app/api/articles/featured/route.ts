export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Article } from '@/models';
import connectDB from '@/lib/db';

// 获取特色文章
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '3', 10);
    
    // 查询条件：已发布且标记为特色的文章
    const query = { 
      status: 'published',
      isFeatured: true
    };
    
    // 执行查询
    const articles = await Article.find(query)
      .populate('categories', 'name slug')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
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
    
    return NextResponse.json({
      success: true,
      message: '获取特色文章成功',
      data: transformedArticles
    });
  } catch (error: any) {
    console.error('获取特色文章失败:', error);
    return NextResponse.json(
      { success: false, message: '获取特色文章失败', error: error.message },
      { status: 500 }
    );
  }
} 