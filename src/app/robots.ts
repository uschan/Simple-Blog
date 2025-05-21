import { MetadataRoute } from 'next';

// 生成robots.txt内容
export default function robots(): MetadataRoute.Robots {
  // 网站基本URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/admin/'], // 不允许爬取管理后台
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
} 