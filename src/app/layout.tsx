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

  return (
    <html lang="zh-CN" className="light">
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
        
        {/* 从后台设置注入统计代码 - 直接使用dangerouslySetInnerHTML */}
        {settings.analytics.trackingCode && (
          <Script
            id="analytics-code"
            dangerouslySetInnerHTML={{ __html: settings.analytics.trackingCode }}
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className={`${raleway.variable} bg-bg text-text min-h-screen flex flex-col transition-colors duration-200`}
      >
        {/* 移除Font Awesome JS版本，只保留CSS版本避免冲突 */}
        
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
      </body>
    </html>
  );
}
