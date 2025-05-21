export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Category } from '@/models';

// 前台分类API，获取所有分类
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 获取所有分类，按推荐和排序字段排序
    const categories = await Category.find()
      .sort({ isFeatured: -1, order: 1, name: 1 })
      .lean();
    
    // 返回分类数据
    return NextResponse.json({
      success: true,
      data: categories
    });
    
  } catch (error: any) {
    console.error('[前台API] 获取分类错误:', error);
    return NextResponse.json({
      success: false,
      message: error.message || '获取分类失败'
    }, { status: 500 });
  }
} 