// app/layout.tsx
import "@/styles/globals.css";
import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import Script from "next/script";
import { getSettings } from "@/lib/api/settings";
import ClientRootLayout from "./ClientRootLayout";
import { Toaster } from 'react-hot-toast'
import { Category } from "@/models";
import connectDB from "@/lib/db";

// 载入 Google Font
const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
});

// 动态 Metadata
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  return {
    title: {
      default: settings.siteName,
      template: `%s | ${settings.siteName}`
    },
    description: settings.siteDescription,
    keywords: settings.siteKeywords,
    icons: { 
      icon: settings.favicon,
      shortcut: settings.favicon,
      apple: settings.favicon,
    },
    metadataBase: new URL(siteUrl),
    openGraph: {
      title: settings.siteName,
      description: settings.siteDescription,
      siteName: settings.siteName,
      images: [settings.logo],
      url: siteUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.siteName,
      description: settings.siteDescription,
      images: [settings.logo],
    },
    alternates: {
      types: {
        'application/rss+xml': `${siteUrl}/api/rss`,
      },
    },
  };
}

// 服务端获取分类函数
async function getCategories() {
  try {
    await connectDB();
    const categories = await Category.find()
      .sort({ isFeatured: -1, order: 1, name: 1 })
      .lean();
    return categories;
  } catch (error) {
    console.error('获取分类失败:', error);
    return [];
  }
}

// Server 组件：只负责框架和加载 ClientRootLayout
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  // 服务端获取分类数据
  const categoriesData = await getCategories();
  
  // 将MongoDB对象转换为普通JavaScript对象
  const categories = JSON.parse(JSON.stringify(categoriesData));
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // 获取统计代码 (这里我们提前获取并解析)
  const analyticsCode = settings.analytics?.trackingCode || '';
  const googleAnalyticsId = analyticsCode.match(/['"](G-[A-Z0-9]+)['"]/)?.[1] || '';
  const umamiWebsiteId = analyticsCode.match(/data-website-id="([^"]+)"/)?.[1] || '';

  return (
    <html lang="zh-CN" className="light" suppressHydrationWarning>
      <head>
        <link rel="icon" href={settings.favicon} />
        <link rel="stylesheet" href="/css/emoji-reactions.css" />
        <link 
          rel="alternate" 
          type="application/rss+xml" 
          title={`${settings.siteName} RSS Feed`}
          href={`${siteUrl}/api/rss`}
        />
        {/* 标准方式加载Font Awesome CSS */}
        <link 
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body
        className={`${raleway.variable} bg-bg text-text min-h-screen flex flex-col transition-colors duration-200`}
      >
        {/* 这里挂 Client 组件，传入 settings */}
        {/* 服务端组件传递给客户端组件 */}
        <ClientRootLayout 
          settings={JSON.parse(JSON.stringify(settings))} 
          categories={categories}
        >
          {children}
        </ClientRootLayout>

        <Toaster position="top-center" toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }} />

        {/* 全局脚本 */}
        <Script id="reactions-js" src="/reactions.js" strategy="afterInteractive" />
        <Script
          id="emoji-reaction-js"
          src="/components/EmojiReaction.js"
          strategy="afterInteractive"
        />
        
        {/* Umami统计 */}
        {umamiWebsiteId && (
          <Script
            id="umami-analytics"
            src="https://cloud.umami.is/script.js"
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
            defer
          />
        )}
        
        {/* Google Analytics统计 */}
        {googleAnalyticsId && (
          <>
            <Script
              id="google-analytics-tag"
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="afterInteractive"
              async
            />
            <Script id="google-analytics-config" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
