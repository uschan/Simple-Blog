export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Comment, Article } from '@/models';

// 获取所有评论
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    // 构建查询条件
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    // 查询评论总数
    const total = await Comment.countDocuments(query);
    
    // 查询评论列表
    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('articleId', 'title slug')
      .lean();
    
    return NextResponse.json({ 
      message: 'Success',
      data: {
        comments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('获取评论失败:', error);
    return NextResponse.json(
      { message: '获取评论列表失败', error: error.message },
      { status: 500 }
    );
  }
}

// 更新评论状态API
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();
    const { id, status } = data;
    
    if (!id) {
      return NextResponse.json(
        { message: '缺少评论ID' },
        { status: 400 }
      );
    }
    
    // 获取评论以便更新关联文章的评论计数
    const comment = await Comment.findById(id);
    
    if (!comment) {
      return NextResponse.json(
        { message: '评论不存在' },
        { status: 404 }
      );
    }
    
    const oldStatus = comment.status;
    comment.status = status;
    await comment.save();
    
    // 如果评论状态从非approved变为approved，更新文章评论计数
    if (oldStatus !== 'approved' && status === 'approved') {
      await Article.findByIdAndUpdate(
        comment.articleId,
        { $inc: { comments: 1 } }
      );
    }
    
    // 如果评论状态从approved变为非approved，减少文章评论计数
    if (oldStatus === 'approved' && status !== 'approved') {
      await Article.findByIdAndUpdate(
        comment.articleId,
        { $inc: { comments: -1 } }
      );
    }
    
    return NextResponse.json({ 
      message: '评论状态更新成功',
      data: comment
    });
  } catch (error: any) {
    console.error('更新评论状态失败:', error);
    return NextResponse.json(
      { message: '更新评论状态失败', error: error.message },
      { status: 500 }
    );
  }
}

// 删除评论API
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { message: '缺少评论ID' },
        { status: 400 }
      );
    }
    
    // 获取评论以便更新关联文章的评论计数
    const comment = await Comment.findById(id);
    
    if (!comment) {
      return NextResponse.json(
        { message: '评论不存在' },
        { status: 404 }
      );
    }
    
    // 删除评论
    await Comment.findByIdAndDelete(id);
    
    // 如果评论状态为approved，减少文章评论计数
    if (comment.status === 'approved') {
      await Article.findByIdAndUpdate(
        comment.articleId,
        { $inc: { comments: -1 } }
      );
    }
    
    return NextResponse.json({ 
      message: '评论删除成功'
    });
  } catch (error: any) {
    console.error('删除评论失败:', error);
    return NextResponse.json(
      { message: '删除评论失败', error: error.message },
      { status: 500 }
    );
  }
} 