"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";
import Script from "next/script";
import "@/app/globals.css";
import { get } from "@/lib/api"; // 导入API工具

const inter = Inter({ subsets: ["latin"] });

// 用于防止重复验证的标记
let verificationInProgress = false;

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  
  // 检查登录状态
  useEffect(() => {
    // 排除登录页的登录检查
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }
    
    // 避免在管理后台主页面重复验证
    if (pathname === '/admin' && verificationInProgress) {
      // 管理后台主页会自己验证令牌，避免重复验证
      setIsLoading(false);
      return;
    }
    
    const checkLoginStatus = async () => {
      verificationInProgress = true;
      
      try {
        const token = localStorage.getItem('adminToken');
        const loggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        
        if (!token || !loggedIn) {
          router.push('/admin/login');
          return;
        }
        
        // 设置登录状态为true（避免无效API调用，使用本地状态判断）
        setIsLoggedIn(true);
        setIsLoading(false);
      } catch (error) {
        // 令牌无效，清除存储并重定向到登录页
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminLoggedIn');
        router.push('/admin/login');
      } finally {
        verificationInProgress = false;
      }
    };
    
    checkLoginStatus();
  }, [pathname, router]);
  
  // 检测屏幕宽度变化并自动调整侧边栏状态
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    window.addEventListener("resize", handleResize);
    handleResize(); // 初始化
    
    // 加载暗色模式状态
    if (typeof window !== 'undefined') {
      const isDark = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // 切换暗色模式
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', newMode.toString());
  };
  
  // 登出
  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };
  
  // 导航项目配置
  const navItems = [
    { path: "/admin/articles", name: "文章管理", icon: "fa-newspaper" },
    { path: "/admin/categories", name: "分类标签", icon: "fa-layer-group" },
    { path: "/admin/comments", name: "评论管理", icon: "fa-comments" },
    { path: "/admin/statistics", name: "访问统计", icon: "fa-chart-simple" },
    { path: "/admin/media", name: "媒体素材", icon: "fa-images" },
    { path: "/admin/settings", name: "系统设置", icon: "fa-sliders" },
    { path: "/admin/quotes", name: "语录分享", icon: "fa-chart-simple" },
    // { path: "/admin/test-token", name: "令牌测试", icon: "fa-key" },
    { path: "/", name: "返回首页", icon: "fa-house" },
  ];
  
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  
  // 登录页使用单独的布局
  if (pathname === '/admin/login') {
    return (
      <div className={inter.className}>
        {children}
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/js/all.min.js"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </div>
    );
  }
  
  // 加载中状态
  if (isLoading) {
    return (
      <div className={`${inter.className} flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2 text-text-light">正在加载管理后台...</p>
        </div>
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/js/all.min.js"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </div>
    );
  }
  
  // 是否激活菜单项
  const isActiveMenuItem = (itemPath: string) => {
    if (pathname === itemPath) return true;
    
    // 对于子页面，如 /admin/articles/edit/123 应该高亮 /admin/articles
    if (itemPath !== '/' && pathname.startsWith(itemPath + '/')) return true;
    
    return false;
  };
  
  // 管理后台主布局
  return (
    <div className={inter.className}>
      <div className="flex h-screen overflow-hidden bg-bg text-text transition-colors duration-200">
        {/* 移动端侧边栏遮罩层 */}
        {sidebarOpen && isMobile && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
                {/* 侧边栏 */}        
        <div className={`bg-bg-card border-r border-gray-200 dark:border-0 transition-all duration-300 flex flex-col z-50            ${isMobile               ? `fixed inset-y-0 left-0 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`              : sidebarOpen ? "w-64" : "w-20"}`          }
        >
          {/* Logo区域 */}
          <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-0">
            <div className="logo flex items-center space-x-3">
                  <svg className="w-10 h-10 text-gray-900 dark:text-white" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 5C11.7157 5 5 11.7157 5 20C5 28.2843 11.7157 35 20 35C28.2843 35 35 28.2843 35 20C35 11.7157 28.2843 5 20 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"/>
                    <path d="M15 18C15 18 17 16 20 16C23 16 25 18 25 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="15" cy="13" r="1.5" stroke="currentColor"/>
                    <circle cx="25" cy="13" r="1.5" stroke="currentColor"/>
                    <path d="M13 26C13 26 16 29 20 29C24 29 27 26 27 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            </div>

          </div>
          
          {/* 导航菜单 */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-2 px-3">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    className={`sidebar-item flex items-center p-3 rounded-lg text-sm ${
                      isActiveMenuItem(item.path)
                        ? "active bg-primary/10 text-primary" 
                        : "text-text-light hover:bg-gray-100 dark:hover:bg-gray-800"
                    } mobile-touch-target`}
                  >
                    <i className={`fas ${item.icon} w-5`}></i>
                    <span className={`${!sidebarOpen ? "hidden" : "ml-3"}`}>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        {/* 主内容区 */}
        <div className="flex-1 overflow-y-auto w-full">
          {/* 顶部导航栏 */}
          <header className="bg-bg-card shadow-sm">
            <div className="flex justify-between items-center px-6 py-2">

              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)} 
                  className="md:hidden text-text-light hover:text-primary mobile-touch-target"
                >
                  <i className="fas fa-bars"></i>
                </button>
              </div>
              
              <div className="flex items-center space-x-3">

                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)} 
                  className="text-text-light hover:text-primary"
                >
                  <i className="fas fa-arrows-left-right-to-line"></i>
                </button>

                {/* 主题切换按钮 */}
                <button 
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-bg-card text-text hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <i className={`fas ${isDarkMode ? "fa-sun" : "fa-moon"}`}></i>
                </button>
                
                {/* 退出登录按钮 */}
                <button 
                  onClick={handleLogout} 
                  className="p-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                  title="退出登录"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            </div>
          </header>
          
          {/* 页面内容 */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* FontAwesome 图标库 */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/js/all.min.js"
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
    </div>
  );
} 