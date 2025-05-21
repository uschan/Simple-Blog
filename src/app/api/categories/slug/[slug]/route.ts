export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Category } from '@/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // 连接数据库
    await connectDB();
    
    // 获取slug参数
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { success: false, message: '缺少分类slug参数' },
        { status: 400 }
      );
    }
    
    console.log(`[API] 查询分类slug: ${slug}`);
    
    // 查询分类
    const category = await Category.findOne({ slug });
    
    if (!category) {
      console.log(`[API] 未找到分类: ${slug}`);
      return NextResponse.json(
        { success: false, message: '未找到该分类' },
        { status: 404 }
      );
    }
    
    console.log(`[API] 找到分类: ${category.name} (${category._id})`);
    
    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('获取分类信息错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
} 