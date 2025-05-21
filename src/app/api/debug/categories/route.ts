export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Category } from '@/models';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 获取所有分类及其详细信息
    const categories = await Category.find().lean();
    
    // 分析slug情况
    const categoriesWithSlugInfo = categories.map(cat => ({
      _id: (cat._id as mongoose.Types.ObjectId).toString(),
      name: cat.name as string,
      slug: cat.slug as string | undefined,
      slugValid: Boolean(cat.slug),
      fallbackSlug: (cat.name as string).toLowerCase(),
      finalSlugUsed: (cat.slug as string) || (cat.name as string).toLowerCase(),
      isFeatured: cat.isFeatured as boolean | undefined
    }));
    
    // 返回调试信息
    return NextResponse.json({
      success: true,
      count: categories.length,
      categoriesWithValidSlug: categories.filter(c => Boolean(c.slug)).length,
      categoriesWithoutSlug: categories.filter(c => !Boolean(c.slug)).length,
      data: categoriesWithSlugInfo
    });
    
  } catch (error: any) {
    console.error('[DEBUG API] 获取分类错误:', error);
    return NextResponse.json({
      success: false,
      message: error.message || '获取分类失败'
    }, { status: 500 });
  }
} 