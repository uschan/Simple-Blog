export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Article } from '@/models';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // 连接数据库
    await connectDB();
    
    // 获取分类ID参数 - 先await context.params再使用id属性
    const params = await context.params;
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少分类ID参数' },
        { status: 400 }
      );
    }
    
    console.log(`[分类API] 查询分类ID: ${id}的文章`);
    
    // 根据分类查询文章
    const articles = await Article.find({ 
      categories: id,
      status: 'published' 
    })
      .sort({ publishedAt: -1, createdAt: -1 }) // 按发布时间和创建时间倒序
      .populate('categories') // 填充分类信息
      .lean();
    
    console.log(`[分类API] 找到文章数量: ${articles.length}`);
    if (articles.length > 0) {
      // 输出第一篇和最后一篇文章的日期，用于排序调试
      const firstArticle = articles[0];
      const lastArticle = articles[articles.length - 1];
      console.log(`[分类API] 第一篇文章: ${firstArticle.title}, 发布时间: ${firstArticle.publishedAt || firstArticle.createdAt}`);
      console.log(`[分类API] 最后一篇文章: ${lastArticle.title}, 发布时间: ${lastArticle.publishedAt || lastArticle.createdAt}`);
    }
    
    // 转换数据，确保字段名映射正确
    const transformedArticles = articles.map(article => ({
      ...article,
      viewCount: article.views || 0,
      likes: article.likes || 0,
      excerpt: article.summary || '',
      featuredImage: article.coverImage || ''
    }));
    
    return NextResponse.json({
      success: true,
      data: transformedArticles
    });
  } catch (error) {
    console.error('获取分类文章错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
} 