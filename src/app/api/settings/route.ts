export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Setting } from '@/models';
import { STANDARD_FIELD_NAMES } from '@/constants/fieldNames';

// 公开API，获取网站设置（版权信息、社交媒体链接等）
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 获取所有设置项
    const settings = await Setting.find().lean();
    
    // 转换为键值对对象
    const settingsObj: Record<string, string> = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    // 解析社交媒体数据
    let socials = [];
    try {
      if (settingsObj[STANDARD_FIELD_NAMES.SOCIALS]) {
        socials = JSON.parse(settingsObj[STANDARD_FIELD_NAMES.SOCIALS]);
      }
    } catch (e) {
      console.error('解析社交媒体数据失败:', e);
    }
    
    // 构建公开可访问的设置对象
    const publicSettings = {
      siteName: settingsObj[STANDARD_FIELD_NAMES.SITE_NAME] || '野盐',
      siteDescription: settingsObj[STANDARD_FIELD_NAMES.SITE_DESCRIPTION] || '',
      siteKeywords: settingsObj[STANDARD_FIELD_NAMES.SITE_KEYWORDS] || '',
      logo: settingsObj[STANDARD_FIELD_NAMES.LOGO] || '/images/logo.svg',
      favicon: settingsObj[STANDARD_FIELD_NAMES.FAVICON] || '/images/favicon.ico',
      copyright: settingsObj[STANDARD_FIELD_NAMES.COPYRIGHT] || '© 2023-2025 野盐. 保留所有权利。',
      socials,
      // 直接提供原始统计代码，不做任何处理
      analyticsCode: settingsObj[STANDARD_FIELD_NAMES.ANALYTICS_CODE] || ''
    };
    
    return NextResponse.json({ 
      success: true,
      data: publicSettings
    });
  } catch (error: any) {
    console.error('获取公开设置失败:', error);
    return NextResponse.json(
      { success: false, message: '获取设置失败', error: error.message },
      { status: 500 }
    );
  }
} 