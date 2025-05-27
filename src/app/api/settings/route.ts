export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Setting } from '@/models';
import { STANDARD_FIELD_NAMES } from '@/constants/fieldNames';

// 公开API，获取网站设置（版权信息、社交媒体链接等）
export async function GET(request: NextRequest) {
  try {
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    headers.set('Surrogate-Control', 'no-store');
    
    await connectDB();
    
    const settings = await Setting.find().lean();
    
    console.log(`[API] 获取到 ${settings.length} 条设置项`);
    
    const settingsObj: Record<string, string> = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    const analyticsCode = settingsObj[STANDARD_FIELD_NAMES.ANALYTICS_CODE];
    console.log(`[API] 获取到统计代码: ${analyticsCode ? analyticsCode.substring(0, 50) + '...' : '无'}`);
    
    let socials = [];
    try {
      if (settingsObj[STANDARD_FIELD_NAMES.SOCIALS]) {
        socials = JSON.parse(settingsObj[STANDARD_FIELD_NAMES.SOCIALS]);
      }
    } catch (e) {
      console.error('解析社交媒体数据失败:', e);
    }
    
    const publicSettings = {
      siteName: settingsObj[STANDARD_FIELD_NAMES.SITE_NAME] || '野盐',
      siteDescription: settingsObj[STANDARD_FIELD_NAMES.SITE_DESCRIPTION] || '',
      siteKeywords: settingsObj[STANDARD_FIELD_NAMES.SITE_KEYWORDS] || '',
      logo: settingsObj[STANDARD_FIELD_NAMES.LOGO] || '/images/logo.svg',
      favicon: settingsObj[STANDARD_FIELD_NAMES.FAVICON] || '/images/favicon.ico',
      copyright: settingsObj[STANDARD_FIELD_NAMES.COPYRIGHT] || '© 2023-2025 野盐. 保留所有权利。',
      socials,
      analyticsCode: settingsObj[STANDARD_FIELD_NAMES.ANALYTICS_CODE] || '',
      analytics: {
        type: settingsObj[STANDARD_FIELD_NAMES.ANALYTICS_TYPE] || 'google',
        trackingCode: settingsObj[STANDARD_FIELD_NAMES.ANALYTICS_CODE] || ''
      }
    };
    
    return NextResponse.json({ 
      success: true,
      data: publicSettings,
      timestamp: new Date().toISOString()
    }, { headers });
  } catch (error: any) {
    console.error('获取公开设置失败:', error);
    return NextResponse.json(
      { success: false, message: '获取设置失败', error: error.message },
      { status: 500 }
    );
  }
} 