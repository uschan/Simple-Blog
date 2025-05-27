export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Setting } from '@/models';
import { STANDARD_FIELD_NAMES } from '@/constants/fieldNames';

// 获取系统设置
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
    
    // 打印获取到的统计代码，便于调试
    console.log('获取到的统计代码字段:', settingsObj[STANDARD_FIELD_NAMES.ANALYTICS_CODE]?.substring(0, 50) + '...');
    
    // 如果没有设置项，初始化默认设置
    if (settings.length === 0) {
      const defaultSettings = {
        [STANDARD_FIELD_NAMES.SITE_NAME]: '野盐博客',
        [STANDARD_FIELD_NAMES.SITE_DESCRIPTION]: '野盐是一个专注于独特设计和艺术创作的平台，分享原创插画、艺术和设计资讯。',
        [STANDARD_FIELD_NAMES.SITE_KEYWORDS]: '博客,技术,分享,设计,艺术',
        [STANDARD_FIELD_NAMES.LOGO]: '/images/logo.svg',
        [STANDARD_FIELD_NAMES.FAVICON]: '/images/favicon.ico',
        [STANDARD_FIELD_NAMES.COPYRIGHT]: '© 2025 野盐.WILDSALT.ME 保留所有权利。',
        [STANDARD_FIELD_NAMES.SOCIALS]: JSON.stringify([
          { name: 'Twitter', url: 'https://x.com/uschan', icon: 'fa-twitter' },
          { name: 'Instagram', url: 'https://instagram.com/bujjun', icon: 'fa-instagram' }
        ]),
        [STANDARD_FIELD_NAMES.ANALYTICS_TYPE]: 'google',
        [STANDARD_FIELD_NAMES.ANALYTICS_CODE]: `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GTM-N5XXDXFQ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GTM-N5XXDXFQ');
</script>`
      };
      
      // 保存默认设置到数据库
      for (const [key, value] of Object.entries(defaultSettings)) {
        const setting = new Setting({ key, value });
        await setting.save();
        settingsObj[key] = value;
      }
    }
    
    // 为前端构建格式化的analytics对象
    settingsObj.analytics = JSON.stringify({
      type: settingsObj[STANDARD_FIELD_NAMES.ANALYTICS_TYPE] || 'custom',
      trackingCode: settingsObj[STANDARD_FIELD_NAMES.ANALYTICS_CODE] || ''
    });
    
    // 向后兼容性支持
    settingsObj.analyticsCode = settingsObj[STANDARD_FIELD_NAMES.ANALYTICS_CODE] || '';
    
    return NextResponse.json({ 
      message: 'Success',
      data: settingsObj
    });
  } catch (error: any) {
    console.error('获取系统设置失败:', error);
    return NextResponse.json(
      { message: '获取系统设置失败', error: error.message },
      { status: 500 }
    );
  }
}

// 更新系统设置 (POST方法)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();
    const settings = data.settings || data;
    
    // 验证设置数据
    if (!settings || Object.keys(settings).length === 0) {
      return NextResponse.json(
        { message: '缺少设置数据' },
        { status: 400 }
      );
    }
    
    // 专门处理统计代码字段
    if (settings.analytics) {
      // 更新统计类型
      if (settings.analytics.type) {
        await Setting.findOneAndUpdate(
          { key: STANDARD_FIELD_NAMES.ANALYTICS_TYPE },
          { value: settings.analytics.type },
          { upsert: true, new: true }
        );
      }
      
      // 更新统计代码
      if (settings.analytics.trackingCode !== undefined) {
        console.log('收到统计代码更新:', settings.analytics.trackingCode.substring(0, 50) + '...');
        await Setting.findOneAndUpdate(
          { key: STANDARD_FIELD_NAMES.ANALYTICS_CODE },
          { value: settings.analytics.trackingCode },
          { upsert: true, new: true }
        );
      }
    } else if (settings.analyticsCode !== undefined) {
      // 向后兼容 - 如果使用老字段也处理
      console.log('收到analyticsCode字段更新:', settings.analyticsCode.substring(0, 50) + '...');
      await Setting.findOneAndUpdate(
        { key: STANDARD_FIELD_NAMES.ANALYTICS_CODE },
        { value: settings.analyticsCode },
        { upsert: true, new: true }
      );
    }
    
    // 更新数据库中的设置
    const updateResults = [];
    
    // 扁平化设置对象
    const flattenSettings = flattenObject(settings);
    
    console.log('扁平化后的设置:', Object.keys(flattenSettings));
    
    // 遍历并保存所有设置
    for (const [key, value] of Object.entries(flattenSettings)) {
      try {
        // 跳过analytics相关字段，已单独处理
        if (key === 'analytics.type' || key === 'analytics.trackingCode' || key === 'analyticsCode') {
          continue;
        }
        
        const result = await Setting.findOneAndUpdate(
          { key },
          { value: String(value) },
          { upsert: true, new: true }
        );
        updateResults.push(result);
      } catch (err) {
        console.error(`保存设置 ${key} 失败:`, err);
        // 继续处理其他设置，不中断整个过程
      }
    }
    
    return NextResponse.json({ 
      message: '系统设置更新成功',
      data: settings,
      updatedCount: updateResults.length
    });
  } catch (error: any) {
    console.error('更新系统设置失败:', error);
    return NextResponse.json(
      { message: '更新系统设置失败', error: error.message },
      { status: 500 }
    );
  }
}

// 辅助函数：将嵌套对象扁平化为键值对
function flattenObject(obj: any, prefix = ''): Record<string, string> {
  return Object.keys(obj).reduce((acc: Record<string, string>, key: string) => {
    const prefixedKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], prefixedKey));
    } else if (Array.isArray(obj[key])) {
      // 处理数组 - 转换为JSON字符串
      acc[prefixedKey] = JSON.stringify(obj[key]);
    } else {
      // 基本类型直接保存
      acc[prefixedKey] = obj[key] !== undefined ? String(obj[key]) : '';
    }
    
    return acc;
  }, {});
} 