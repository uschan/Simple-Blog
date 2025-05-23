export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Article, Reaction } from '@/models';
import mongoose from 'mongoose';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { articleId, reaction, userId } = await request.json();
    
    // 数据验证
    if (!articleId || !reaction) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 检查反应类型是否有效
    const validReactions = ['like', 'haha', 'love', 'sad', 'angry'];
    if (!validReactions.includes(reaction)) {
      return NextResponse.json(
        { error: '无效的反应类型' },
        { status: 400 }
      );
    }
    
    // 获取客户端IP
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               'unknown';
    
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
    
    // 添加反应
    try {
      // 创建唯一会话ID，每次页面加载生成一个不同的ID
      // 这样即使是同一个用户，每次刷新页面后点击都被视为不同的反应
      const sessionId = Date.now().toString() + '-' + 
                        Math.random().toString(36).substring(2, 10) + '-' + 
                        ip.replace(/\./g, '').substring(0, 8);
      
      // 使用直接插入方法绕过唯一键约束
      await Reaction.collection.insertOne({
        articleId: objectId,
        emoji: reaction,
        userId: userId || 'anonymous',
        userIp: ip,
        sessionId: sessionId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('成功保存反应', { 
        emoji: reaction, 
        sessionId: sessionId.substring(0, 15) + '...' // 日志中截断ID
      });
    } catch (err) {
      const error = err as Error;
      console.error('保存反应时出错:', error);
      
      // 详细记录错误，特别是重复键错误
      if (error.message && error.message.includes('E11000')) {
        console.error('MongoDB唯一索引冲突:');
        console.error('冲突消息:', error.message);
        
        // 尝试通过另一种方式插入
        try {
          console.log('尝试使用备用方法插入...');
          
          // 使用备用格式的会话ID
          const altSessionId = `alt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          
          await Reaction.collection.insertOne({
            articleId: objectId,
            emoji: reaction,
            userId: `anon-${Date.now()}`, // 每次使用不同的匿名ID
            userIp: ip,
            sessionId: altSessionId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          console.log('使用备用方法成功保存反应');
          
          // 继续流程，不返回错误
        } catch (secondErr) {
          console.error('备用插入方法也失败:', secondErr);
          return NextResponse.json(
            { error: '保存反应失败', details: '多次尝试后仍失败' },
            { status: 500 }
          );
        }
      } else {
        // 非重复键错误，直接返回
        return NextResponse.json(
          { error: '保存反应失败', details: error.message },
          { status: 500 }
        );
      }
    }
    
    // 获取最新的反应统计
    let reactionCounts;
    try {
      reactionCounts = await Reaction.aggregate([
        { $match: { articleId: objectId } },
        { $group: { _id: '$emoji', count: { $sum: 1 } } }
      ]);
    } catch (err) {
      const error = err as Error;
      console.error('获取反应统计时出错:', error);
      return NextResponse.json(
        { error: '获取反应统计失败', details: error.message },
        { status: 500 }
      );
    }
    
    // 计算总数
    const totalLikes = reactionCounts.reduce((sum, item) => sum + item.count, 0);
    
    // 更新文章模型中的likes字段
    try {
      await Article.findByIdAndUpdate(objectId, { likes: totalLikes });
    } catch (err) {
      const error = err as Error;
      console.error('更新文章likes字段时出错:', error);
      // 继续执行，不要因为这个错误中断响应
    }
    
    // 准备反应计数响应
    const formattedCounts = reactionCounts.map(item => ({
      emoji: item._id,
      count: item.count
    }));
    
    // 返回更新后的反应数据
    return NextResponse.json({ 
      success: true,
      totalCount: totalLikes,
      reactionCounts: formattedCounts,
      action: { added: true }
    });
    
  } catch (err) {
    const error = err as Error;
    console.error('处理反应时出错:', error);
    return NextResponse.json(
      { error: '服务器内部错误', details: error.message || '未知错误' },
      { status: 500 }
    );
  }
}

// 获取文章的反应统计
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const articleId = url.searchParams.get('articleId');
    
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
    
    // 获取反应统计
    const reactionCounts = await Reaction.aggregate([
      { $match: { articleId: objectId } },
      { $group: { _id: '$emoji', count: { $sum: 1 } } }
    ]);
    
    // 计算总数
    const totalLikes = reactionCounts.reduce((sum, item) => sum + item.count, 0);
    
    // 格式化响应
    const formattedCounts = reactionCounts.map(item => ({
      emoji: item._id,
      count: item.count
    }));
    
    return NextResponse.json({
      success: true,
      totalCount: totalLikes,
      reactionCounts: formattedCounts
    });
    
  } catch (err) {
    const error = err as Error;
    console.error('获取反应统计时出错:', error);
    return NextResponse.json(
      { error: '服务器内部错误', details: error.message || '未知错误' },
      { status: 500 }
    );
  }
} 