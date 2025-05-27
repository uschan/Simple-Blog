// app/ClientRootLayout.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import Script from "next/script";

interface Settings {
  siteName?: string;
  siteDescription?: string;
  siteKeywords?: string;
  logo?: string;
  favicon?: string;
  copyright?: string;
  socials?: any[];
  analytics?: {
    type: 'google' | 'umami' | 'custom';
    trackingCode: string;
  };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  isFeatured?: boolean;
  [key: string]: any; // 允许其他属性
}

export default function ClientRootLayout({
  settings,
  categories = [],
  children,
}: {
  settings: Settings;
  categories: Category[];
  children: ReactNode;
}) {
  const pathname = usePathname() || "";
  const isAdmin = pathname.startsWith("/admin");
  
  // 处理主题持久化
  useEffect(() => {
    // 从localStorage读取主题设置
    const savedTheme = localStorage.getItem('theme');
    
    // 应用保存的主题或系统偏好
    if (savedTheme === 'dark' || 
        (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    // 添加系统主题变化监听
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    // 清理函数
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  return (
    <>
      {/* 只有非 /admin 显示前台头部 */}
      {!isAdmin && <Navbar categories={categories} />}

      <main className="flex-grow">{children}</main>

      {!isAdmin && (
        <Footer
          initialCopyright={settings?.copyright || ""}
          initialSocials={settings?.socials || []}
        />
      )}
    </>
  );
}
