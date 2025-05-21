'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import OptimizedImage from './OptimizedImage';
import { get } from '@/lib/api'; // 导入get函数获取设置

// 分类接口定义
interface Category {
  _id: string;
  name: string;
  slug: string;
  isFeatured?: boolean;
  [key: string]: any; // 允许其他属性
}

// 嵌入式Logo组件
function Logo() {
  return (
    <svg 
      viewBox="25 105 150 70" 
      height="40" 
      width="85.72" 
      preserveAspectRatio="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="h-10"
    >
      <path className="face" d="M35,125 C40,120 160,120 170,125 C175,135 175,165 170,170 C160,175 40,175 35,170 C25,160 30,130 35,125 Z" fill="#e0c9a6" stroke="#333" strokeWidth="4" strokeLinecap="round" />
      <path d="M65,132 C75,125 125,125 135,132 C145,140 145,150 135,158 C125,165 75,165 65,158 C55,150 55,140 65,132 Z" fill="#fff" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      <path d="M80,145 L120,145" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      <path d="M90,135 L90,155 M100,132 L100,158 M110,135 L110,155" stroke="#333" strokeWidth="2" strokeLinecap="round" />
      <path d="M125,145 L135,138 C138,142 138,148 135,152 Z" fill="#333" stroke="#333" strokeWidth="1" strokeLinejoin="round" />
      <path className="wiggle" d="M65,105 C70,110 75,112 80,118 M135,105 C130,110 125,112 120,118" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      <circle cx="78" cy="155" r="3" fill="#333" className="wiggle" />
      <circle cx="130" cy="160" r="2" fill="#333" className="wiggle" />
      <circle cx="70" cy="140" r="2" fill="#333" className="wiggle" />
      <style jsx>{`
        @keyframes wiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-5deg); }
            75% { transform: rotate(5deg); }
        }
        
        .wiggle {
            animation: wiggle 2s ease-in-out infinite;
            transform-origin: center;
        }
        
        :global(.dark) .wiggle,
        :global(.dark) .face {
            stroke: orange;
        }

        }
      `}</style>
    </svg>
  );
}

// 创建单独的主题切换图标组件，只在客户端渲染
function ThemeIcon() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 检测当前主题是否为暗色
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };
    
    // 初始检测
    checkTheme();
    
    // 设置MutationObserver监听html标签class变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    // 清理监听器
    return () => observer.disconnect();
  }, []);

  if (!mounted) return <span className="w-4 h-4"></span>;

  return isDark ? 
    <i className="fas fa-sun text-yellow-500"></i> : 
    <i className="fas fa-moon"></i>;
}

// 更新Navbar组件接收服务端预渲染的分类数据
export default function Navbar({ categories = [] }: { categories: Category[] }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  // 不再需要获取分类，直接使用传入的分类
  const [isLoading, setIsLoading] = useState(false);
  const [siteLogo, setSiteLogo] = useState('/images/avatar.png'); // 默认logo
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // 获取当前日期信息，格式化显示
  const currentDate = new Date();
  const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const formattedDate = `${dayNames[currentDate.getDay()]} ${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}`;
  
  // 暗色模式切换功能
  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    // 保存主题偏好到localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  // 监听滚动事件，控制导航栏样式
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // 清理监听器
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 处理点击页面其他区域关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    // 仅在客户端执行
    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      }
    };
  }, [isMenuOpen]);

  // 客户端组件挂载时初始化
  useEffect(() => {
    // 立即设置为已挂载，不阻止初始渲染
    setMounted(true);
    
    // 从localStorage读取并设置主题
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const isDark = savedTheme === 'dark' || 
                    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // 获取网站设置中的logo
      const fetchLogo = async () => {
        try {
          const response = await get('/api/settings');
          if (response.success && response.data && response.data.logo) {
            setSiteLogo(response.data.logo);
          }
        } catch (error) {
          console.error('获取网站Logo失败:', error);
        }
      };
      
      fetchLogo();
    }
  }, []);

  return (
    <>
      {/* 顶部信息栏 - 在移动端隐藏 */}
      <div className="bg-bg-card text-xs border-b border-gray-200 hidden sm:block">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span>
              <i className="fa-solid fa-calendar-days mr-2"></i>
              {formattedDate}
            </span>
            <span>|</span>
            <Link href="https://wildsalt.me" target="_blank" className="text-text hover:text-primary">WILDSALT</Link>
            <Link href="https://ci.wildsalt.me" target="_blank" className="text-text hover:text-primary">小词大意</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/api/rss" target="_blank" className="text-text hover:text-primary" title="RSS订阅">
              <i className="fas fa-rss"></i>
            </Link>
            <span>记录一个无法被标准化的人,在模糊中选择看清，在混乱中主动寻找意义</span>
          </div>
        </div>
      </div>

      {/* 主导航栏 - 固定在顶部 */}
      <header 
        className={`bg-bg-card py-2 shadow-sm transition-all duration-300 ${
          isScrolled ? 'sticky top-0 z-50 shadow-md' : ''
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="logo">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          
          {/* 桌面端导航 */}
          <nav className="hidden text-sm font-medium md:flex space-x-6">
            <Link href="/" className="text-text hover:text-primary">首页</Link>
            {/* 显示前5个分类，不再需要骨架屏 */}
            {categories.slice(0, 8).map((category) => (
              <Link 
                key={category._id}
                href={`/category/${category.slug}`} 
                className="text-text hover:text-primary"
              >
                {category.name}
              </Link>
            ))}

          </nav>
          
          {/* 圆形logo和主题切换 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <OptimizedImage 
                src={siteLogo} 
                alt="野盐" 
                width={32} 
                height={32} 
                className="rounded-full object-cover" 
                priority
              />
              <span className="ml-2 text-text-light hidden md:inline">野盐</span>
            </div>
            
            {/* 主题切换按钮 - 使用纯客户端组件 */}
            <button 
              onClick={toggleDarkMode}
              className="w-8 h-8 rounded-full bg-bg-card text-2xl text-text hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
              aria-label="切换主题"
            >
              {mounted && <ThemeIcon />}
            </button>
            
            {/* 汉堡菜单按钮 */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-bg-card text-2xl text-text hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="打开菜单"
            >
              <i className="fa-solid fa-fingerprint"></i>
            </button>
          </div>
        </div>
      </header>
      
      {/* 移动端侧边菜单 - 覆盖层 */}
      {isMenuOpen && (
        <div 
          ref={overlayRef}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
      
      {/* 移动端侧边菜单 */}
      <div 
        ref={menuRef}
        className={`fixed top-0 right-0 h-full w-64 bg-bg-card shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-bold text-primary">菜单导航</h2>
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-full text-2xl"
            aria-label="关闭菜单"
          >
            <i className="fa-solid fa-circle-xmark"></i>
          </button>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-4">
            <li>
              <Link 
                href="/" 
                className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="fa-solid fa-mountain-city mr-2"></i> 首页
              </Link>
            </li>
            {/* 移动端菜单也使用传入的分类 */}
            {categories.slice(0, 8).map((category) => (
              <li key={category._id}>
                <Link 
                  href={`/category/${category.slug}`} 
                  className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className="fa-solid fa-angles-right mr-2"></i> {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link 
                href="/api/rss" 
                className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
                target="_blank"
              >
                <i className="fas fa-rss mr-2"></i> RSS订阅
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
} 