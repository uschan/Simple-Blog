export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Article } from '@/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 连接数据库
    await connectDB();
    
    // 获取分类ID参数
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少分类ID参数' },
        { status: 400 }
      );
    }
    
    // 根据分类查询文章
    const articles = await Article.find({ 
      categories: id,
      status: 'published' 
    })
      .sort({ publishedAt: -1 }) // 按发布时间倒序
      .populate('categories') // 填充分类信息
      .lean();
    
    return NextResponse.json({
      success: true,
      data: articles
    });
  } catch (error) {
    console.error('获取分类文章错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
} 