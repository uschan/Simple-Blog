export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Article, PageView } from '@/models';
import mongoose from 'mongoose';
import { headers } from 'next/headers';

// 获取文章的访问统计
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const articleId = url.searchParams.get('articleId');
    const period = url.searchParams.get('period') || 'all'; // all, today, week, month
    
    if (!articleId) {
      return NextResponse.json(
        { error: '缺少文章ID参数' },
        { status: 400 }
      );
    }
    
    // 验证articleId是否是有效的ObjectId格式
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return NextResponse.json(
        { error: 'articleId格式无效' },
        { status: 400 }
      );
    }
    
    const objectId = new mongoose.Types.ObjectId(articleId);
    
    // 验证文章是否存在
    const articleExists = await Article.exists({ _id: objectId });
    if (!articleExists) {
      return NextResponse.json(
        { error: '找不到指定的文章' },
        { status: 404 }
      );
    }
    
    // 根据时间段构建查询条件
    const query: any = { articleId: objectId };
    
    const now = new Date();
    if (period === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query.createdAt = { $gte: startOfDay };
    } else if (period === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // 从本周日开始
      startOfWeek.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: startOfWeek };
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query.createdAt = { $gte: startOfMonth };
    }
    
    // 获取统计数据
    const totalViews = await PageView.countDocuments(query);
    
    // 获取唯一访客数
    const uniqueVisitors = await PageView.aggregate([
      { $match: query },
      { $group: { _id: '$ip' } },
      { $count: 'count' }
    ]);
    
    // 获取设备类型统计
    const deviceStats = await PageView.aggregate([
      { $match: query },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } }
    ]);
    
    // 获取最近的访问时间
    const latestView = await PageView.findOne(query).sort({ createdAt: -1 });
    
    // 构建返回数据
    const viewStats = {
      totalViews,
      uniqueVisitors: uniqueVisitors.length > 0 ? uniqueVisitors[0].count : 0,
      deviceStats: deviceStats.map(item => ({
        deviceType: item._id,
        count: item.count
      })),
      latestView: latestView ? latestView.createdAt : null
    };
    
    return NextResponse.json({
      success: true,
      articleId,
      period,
      viewStats
    });
    
  } catch (err) {
    const error = err as Error;
    console.error('获取访问统计时出错:', error);
    return NextResponse.json(
      { error: '服务器内部错误', details: error.message || '未知错误' },
      { status: 500 }
    );
  }
}

// 增加文章访问计数
export async function POST(request: Request) {
  try {
    const { articleId } = await request.json();
    
    // 数据验证
    if (!articleId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 获取客户端信息 - 确保先await headers()
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';
    const referer = headersList.get('referer') || '';
    
    // 尝试转换ObjectId，包括错误处理
    let objectId;
    try {
      // 验证articleId是否是有效的ObjectId格式
      if (!mongoose.Types.ObjectId.isValid(articleId)) {
        return NextResponse.json(
          { error: 'articleId格式无效' },
          { status: 400 }
        );
      }
      objectId = new mongoose.Types.ObjectId(articleId);
    } catch (err) {
      const error = err as Error;
      console.error('ObjectId转换错误:', error);
      return NextResponse.json(
        { error: 'articleId格式无效' },
        { status: 400 }
      );
    }
    
    // 检查文章是否存在
    const articleExists = await Article.exists({ _id: objectId });
    if (!articleExists) {
      return NextResponse.json(
        { error: '找不到指定的文章' },
        { status: 404 }
      );
    }
    
    // 检查是否是重复访问（同一IP 30分钟内访问同一文章）
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existingView = await PageView.findOne({
      articleId: objectId,
      ip,
      createdAt: { $gte: thirtyMinutesAgo }
    });
    
    // 如果是重复访问，不增加计数，但返回成功
    if (existingView) {
      return NextResponse.json({
        success: true,
        message: '重复访问不计数',
        viewCount: await Article.findById(objectId).select('views').then(doc => doc?.views || 0)
      });
    }
    
    // 判断设备类型
    let deviceType = 'unknown';
    if (userAgent.includes('Mobile')) {
      deviceType = 'mobile';
    } else if (userAgent.includes('Tablet')) {
      deviceType = 'tablet';
    } else if (!userAgent.includes('Bot') && !userAgent.includes('bot')) {
      deviceType = 'desktop';
    }
    
    // 创建新的访问记录
    const newPageView = new PageView({
      articleId: objectId,
      ip,
      userAgent,
      referer,
      deviceType,
      sessionId: `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
    });
    
    await newPageView.save();
    
    // 原子操作增加文章的浏览量计数
    const updatedArticle = await Article.findByIdAndUpdate(
      objectId,
      { $inc: { views: 1 } },
      { new: true }
    );
    
    return NextResponse.json({
      success: true,
      viewCount: updatedArticle?.views || 0,
      message: '访问计数成功增加'
    });
    
  } catch (err) {
    const error = err as Error;
    console.error('增加访问计数时出错:', error);
    return NextResponse.json(
      { error: '服务器内部错误', details: error.message || '未知错误' },
      { status: 500 }
    );
  }
} 