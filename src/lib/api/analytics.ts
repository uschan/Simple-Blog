'use server';

import connectDB from '@/lib/db';
import { Setting } from '@/models';
import { STANDARD_FIELD_NAMES } from '@/constants/fieldNames';

/**
 * 设置网站分析代码
 * @param type 分析类型 - google, umami 或 custom
 * @param trackingCode 跟踪代码
 */
export async function setAnalyticsSettings(type: 'google' | 'umami' | 'custom', trackingCode: string) {
  try {
    await connectDB();
    
    // 更新或创建分析类型设置
    await Setting.findOneAndUpdate(
      { key: STANDARD_FIELD_NAMES.ANALYTICS_TYPE },
      { value: type },
      { upsert: true }
    );
    
    // 更新或创建跟踪代码设置
    await Setting.findOneAndUpdate(
      { key: STANDARD_FIELD_NAMES.ANALYTICS_CODE },
      { value: trackingCode },
      { upsert: true }
    );
    
    return { success: true };
  } catch (error) {
    console.error('设置分析代码失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    };
  }
}

/**
 * 获取网站分析设置
 */
export async function getAnalyticsSettings() {
  try {
    await connectDB();
    
    const typeDoc = await Setting.findOne({ key: STANDARD_FIELD_NAMES.ANALYTICS_TYPE }).lean();
    const codeDoc = await Setting.findOne({ key: STANDARD_FIELD_NAMES.ANALYTICS_CODE }).lean();
    
    return {
      type: (typeDoc && typeof typeDoc === 'object' && 'value' in typeDoc ? typeDoc.value : 'google') as 'google' | 'umami' | 'custom',
      trackingCode: (codeDoc && typeof codeDoc === 'object' && 'value' in codeDoc ? codeDoc.value : ''),
    };
  } catch (error) {
    console.error('获取分析设置失败:', error);
    return {
      type: 'google' as const,
      trackingCode: '',
    };
  }
} 