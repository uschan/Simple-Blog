export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Setting } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 获取所有设置项
    const settings = await Setting.find().lean();
    
    // 返回原始数据以便调试
    return NextResponse.json({ 
      message: 'Success',
      count: settings.length,
      settings: settings
    });
  } catch (error: any) {
    console.error('调试错误:', error);
    return NextResponse.json(
      { message: '调试错误', error: error.message },
      { status: 500 }
    );
  }
} 