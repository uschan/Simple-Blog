export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Article } from '@/models';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';

// 获取文章列表
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const category = url.searchParams.get('category');
    const tag = url.searchParams.get('tag');
    const featured = url.searchParams.get('featured') === 'true';
    const slider = url.searchParams.get('slider') === 'true';
    
    // 构建查询条件
    const query: any = { status: 'published' };
    
    if (category) {
      // 尝试将分类名称转换为ID查询
      try {
        if (mongoose.Types.ObjectId.isValid(category)) {
          query.categories = { $in: [new mongoose.Types.ObjectId(category)] };
        } else {
          // 如果提供的是slug而不是ID，需要先通过slug查找分类
          // 这里简化处理，实际情况应该先查询分类集合
          query['categories.slug'] = category;
        }
      } catch (err) {
        console.error('分类ID转换错误:', err);
      }
    }
    
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    if (featured) {
      query.isFeatured = true;
    }
    
    if (slider) {
      query.isSlider = true;
    }
    
    // 计算分页
    const skip = (page - 1) * limit;
    
    // 执行查询
    const articles = await Article.find(query)
      .populate('categories', 'name slug')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // 获取总数用于分页
    const total = await Article.countDocuments(query);
    
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
      coverGallery: article.coverGallery || [],
      coverVideo: article.coverVideo || '',
      status: article.status,
      isSlider: article.isSlider || false,
      isFeatured: article.isFeatured || false
    }));
    
    return NextResponse.json({
      message: 'Success',
      data: transformedArticles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('获取文章列表失败:', error);
    return NextResponse.json(
      { message: '获取文章列表失败', error: error.message },
      { status: 500 }
    );
  }
} 