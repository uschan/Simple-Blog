"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  
  useEffect(() => {
    // 如果已经验证过，不要重复验证
    if (verified) return;
    
    // 检查登录状态并加载管理员信息
    const loadAdminInfo = async () => {
      try {
        // 检查本地存储中的登录信息
        const adminToken = localStorage.getItem('adminToken');
        const adminUser = localStorage.getItem('adminUser');
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        
        // console.log('[Admin Debug] 检查登录状态:', { isLoggedIn, hasToken: !!adminToken, hasUser: !!adminUser });
        
        if (!isLoggedIn || !adminToken || !adminUser) {
          // console.log('[Admin] 未找到登录信息，跳转到登录页');
          router.push('/admin/login');
          return;
        }
        
        // 解析管理员信息
        try {
          const userInfo = JSON.parse(adminUser);
          setAdminInfo(userInfo);
          
          // 如果有用户信息，直接显示页面
          // 无需再验证令牌，避免重复请求
          setVerified(true);
          setLoading(false);
          return;
        } catch (e) {
          console.error('[Admin] 解析用户信息失败:', e);
          router.push('/admin/login');
          return;
        }
      } catch (error) {
        console.error('[Admin] 加载管理员信息失败:', error);
        setError('加载管理员信息失败');
        router.push('/admin/login');
      }
    };
    
    loadAdminInfo();
  }, [router, verified]); // 添加verified作为依赖项
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2 text-text-light">正在加载管理后台...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-6">
          <h1 className="text-xl font-semibold mb-4">欢迎回来，{adminInfo?.nickname || adminInfo?.username}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">管理员控制台</p>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button onClick={() => router.push('/admin/articles')} 
                    className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <i className="fas fa-newspaper text-xl text-blue-600 dark:text-blue-400 mb-2"></i>
              <p className="text-sm">文章管理</p>
            </button>
            
            <button onClick={() => router.push('/admin/categories')} 
                    className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <i className="fas fa-layer-group text-xl text-green-600 dark:text-green-400 mb-2"></i>
              <p className="text-sm">分类管理</p>
            </button>
            
            <button onClick={() => router.push('/admin/media')} 
                    className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <i className="fas fa-images text-xl text-purple-600 dark:text-purple-400 mb-2"></i>
              <p className="text-sm">媒体管理</p>
            </button>
            
            <button onClick={() => router.push('/admin/settings')} 
                    className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <i className="fas fa-sliders text-xl text-gray-600 dark:text-gray-400 mb-2"></i>
              <p className="text-sm">系统设置</p>
            </button>
          </div>
        </div>
        
        <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">系统状态</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">登录状态</span>
              <span className="text-green-600 dark:text-green-400">已登录</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">角色</span>
              <span>{adminInfo?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">账户</span>
              <span>{adminInfo?.username}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 