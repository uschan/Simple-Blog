"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api"; // 导入API工具

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // 在组件加载时清除旧的登录信息
  useEffect(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminLoggedIn');
    // console.log('[Login] 已清除旧的登录信息');
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      // 使用API工具调用登录API
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      // 解析响应
      const data = await response.json();
      
      // 检查响应状态
      if (!response.ok) {
        throw new Error(data.message || '登录失败');
      }
      
      // console.log('[Login Debug] 获取到的响应数据:', JSON.stringify(data));
      
      if (!data || !data.data || !data.data.token) {
        throw new Error('登录失败：服务器没有返回有效的登录信息');
      }
      
      // 保存令牌到localStorage
      localStorage.setItem('adminToken', data.data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.data.user));
      localStorage.setItem('adminLoggedIn', 'true');
      
      // console.log('[Login] 登录成功，令牌:', data.data.token.substring(0, 15) + '...');
      
      // 获取存储的令牌并打印
      const storedToken = localStorage.getItem('adminToken');
      if (storedToken) {
        // console.log('[Login Debug] 存储到localStorage的令牌:', storedToken.substring(0, 15) + '...');
      }
      
      // 直接导航到管理后台
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || '登录过程中发生错误');
      console.error('[Login] 登录失败:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">管理后台登录</h1>
          <p className="text-sm text-gray-600 mt-2">请输入您的账号信息以登录</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              id="password"
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg"
          >
            {isLoading ? "登录中..." : "登录"}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
        </div>
      </div>
    </div>
  );
} 