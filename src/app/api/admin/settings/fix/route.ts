export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Setting, ISetting } from '@/models';
import { STANDARD_FIELD_NAMES } from '@/constants/fieldNames';

// 紧急修复统计代码问题的API
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 确保安全访问，只允许带有特定秘钥的请求访问
    const secretKey = request.nextUrl.searchParams.get('key');
    if (secretKey !== 'fix_analytics_2025') {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 403 }
      );
    }
    
    // 获取新的统计代码参数
    const newCode = request.nextUrl.searchParams.get('code');
    
    // 如果提供了新代码，则更新统计代码
    if (newCode) {
      console.log('直接更新统计代码:', newCode.substring(0, 50) + '...');
      
      // 直接更新统计代码字段
      await Setting.findOneAndUpdate(
        { key: STANDARD_FIELD_NAMES.ANALYTICS_CODE },
        { value: newCode },
        { upsert: true, new: true }
      );
      
      return NextResponse.json({
        success: true,
        message: '统计代码已更新',
        codeLength: newCode.length
      });
    }
    
    // 如果没有提供新代码，返回当前统计代码信息
    const currentSetting = await Setting.findOne({ key: STANDARD_FIELD_NAMES.ANALYTICS_CODE }).lean();
    
    if (!currentSetting) {
      return NextResponse.json({
        success: true,
        message: '当前统计代码信息',
        codeExists: false,
        codeLength: 0,
        codePreview: ''
      });
    }
    
    // 强制类型断言，以安全访问value属性
    const settingData = currentSetting as unknown as { value: string };
    
    return NextResponse.json({
      success: true,
      message: '当前统计代码信息',
      codeExists: true,
      codeLength: settingData.value?.length || 0,
      codePreview: settingData.value?.substring(0, 100) + '...' || ''
    });
  } catch (error: any) {
    console.error('修复统计代码失败:', error);
    return NextResponse.json(
      { success: false, message: '修复统计代码失败', error: error.message },
      { status: 500 }
    );
  }
} 