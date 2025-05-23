import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Article } from '@/models';

// 获取单个文章详情
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectDB();
    const id = context.params.id;
    
    if (!id) {
      return NextResponse.json(
        { message: '缺少文章ID' },
        { status: 400 }
      );
    }
    
    const dbArticle = await Article.findById(id)
      .populate('categories', 'name')
      .lean();
    
    if (!dbArticle) {
      return NextResponse.json(
        { message: '文章不存在' },
        { status: 404 }
      );
    }
    
    // 映射数据库字段到前端字段
    const articleData = dbArticle as any;
    const article = {
      ...dbArticle,
      excerpt: articleData.summary ?? '',
      featuredImage: articleData.coverImage ?? '',
    };
    
    return NextResponse.json({ 
      message: 'Success',
      data: article
    });
  } catch (error: any) {
    console.error('获取文章详情失败:', error);
    return NextResponse.json(
      { message: '获取文章详情失败', error: error.message },
      { status: 500 }
    );
  }
}

// 更新单个文章
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectDB();
    const id = context.params.id;
    const formData = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { message: '缺少文章ID' },
        { status: 400 }
      );
    }
    
    // 映射前端字段到数据库字段
    const data = {
      ...formData,
      summary: formData.excerpt || '',
      coverImage: formData.featuredImage || '',
    };
    
    // 如果状态从草稿改为已发布，设置发布时间
    if (data.status === 'published') {
      // 使用findById而不是lean()以确保正确获取文档类型
      const article = await Article.findById(id);
      
      if (article && article.status !== 'published') {
        data.publishedAt = new Date();
      }
    }
    
    // 更新文章
    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    ).populate('categories', 'name');
    
    if (!updatedArticle) {
      return NextResponse.json(
        { message: '文章不存在' },
        { status: 404 }
      );
    }
    
    // 映射数据库字段到前端字段
    const article = {
      ...updatedArticle.toObject(),
      excerpt: updatedArticle.summary || '',
      featuredImage: updatedArticle.coverImage || '',
    };
    
    return NextResponse.json({ 
      message: '文章更新成功',
      data: article
    });
  } catch (error: any) {
    console.error('更新文章失败:', error);
    return NextResponse.json(
      { message: '更新文章失败', error: error.message },
      { status: 500 }
    );
  }
}

// 删除单个文章
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectDB();
    const id = context.params.id;
    
    if (!id) {
      return NextResponse.json(
        { message: '缺少文章ID' },
        { status: 400 }
      );
    }
    
    // 删除文章
    const deletedArticle = await Article.findByIdAndDelete(id);
    
    if (!deletedArticle) {
      return NextResponse.json(
        { message: '文章不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: '文章删除成功'
    });
  } catch (error: any) {
    console.error('删除文章失败:', error);
    return NextResponse.json(
      { message: '删除文章失败', error: error.message },
      { status: 500 }
    );
  }
} 