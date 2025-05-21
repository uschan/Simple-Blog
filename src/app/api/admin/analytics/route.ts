export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Article, Comment, Category } from '@/models';

// 获取网站统计数据
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'week'; // 默认统计周期
    
    // 根据统计周期计算开始日期
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7); // 默认一周
    }
    
    // 统计汇总数据
    const [
      totalArticles,
      totalComments,
      totalPublishedArticles,
      totalCategories,
      recentArticleCount,
      recentCommentCount,
      popularArticles
    ] = await Promise.all([
      Article.countDocuments(), // 所有文章
      Comment.countDocuments(), // 所有评论
      Article.countDocuments({ status: 'published' }), // 已发布文章
      Category.countDocuments(), // 分类数量
      Article.countDocuments({ createdAt: { $gte: startDate } }), // 最近新增文章
      Comment.countDocuments({ createdAt: { $gte: startDate } }), // 最近新增评论
      Article.find({ status: 'published' }) // 热门文章
        .sort({ views: -1 })
        .limit(5)
        .select('title slug views comments createdAt')
        .lean()
    ]);
    
    // 获取每天新增数据
    const dailyData = {
      views: [],
      articles: [],
      comments: []
    };
    
    // 构建响应数据
    const analyticsData = {
      summary: {
        totalArticles,
        totalComments,
        totalPublishedArticles,
        totalCategories,
        recentArticleCount,
        recentCommentCount
      },
      trends: dailyData,
      popular: popularArticles
    };
    
    return NextResponse.json({ 
      message: 'Success',
      data: analyticsData
    });
  } catch (error: any) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { message: '获取统计数据失败', error: error.message },
      { status: 500 }
    );
  }
} 