export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Article, Setting } from '@/models';
import { STANDARD_FIELD_NAMES } from '@/constants/fieldNames';

// 格式化日期为RSS兼容格式
function formatDate(date: Date): string {
  return date.toUTCString();
}

// 生成RSS XML内容
export async function GET() {
  try {
    await connectDB();
    
    // 获取网站设置
    const settings = await Setting.find().lean();
    const settingsObj: Record<string, string> = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    // 网站基本信息
    const siteName = settingsObj[STANDARD_FIELD_NAMES.SITE_NAME] || '野盐';
    const siteDescription = settingsObj[STANDARD_FIELD_NAMES.SITE_DESCRIPTION] || '分享技术、艺术与生活';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // 获取最新发布的文章（最多50篇）
    const articles = await Article.find({ status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(50)
      .lean();
    
    // 构建RSS XML
    let rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${formatDate(new Date())}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml" />
`;
    
    // 添加每篇文章到RSS
    articles.forEach(article => {
      const articleUrl = `${siteUrl}/article/${article.slug}`;
      const pubDate = article.publishedAt || article.createdAt;
      
      rssXml += `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${articleUrl}</link>
      <guid>${articleUrl}</guid>
      <pubDate>${formatDate(pubDate)}</pubDate>
      <description>${escapeXml(article.summary)}</description>
    </item>
`;
    });
    
    // 完成RSS XML
    rssXml += `  </channel>
</rss>`;
    
    // 设置内容类型为XML并返回
    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800' // 30分钟缓存
      }
    });
  } catch (error: any) {
    console.error('生成RSS失败:', error);
    
    // 返回错误信息，但保持XML格式
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>RSS生成错误</title>
    <description>生成RSS时发生错误: ${escapeXml(error.message)}</description>
  </channel>
</rss>`;
    
    return new NextResponse(errorXml, { 
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    });
  }
}

// 辅助函数：转义XML特殊字符
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
} 