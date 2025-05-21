'use client';

import { useState, useEffect } from 'react';

export default function TestTokenPage() {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // 检查令牌并测试
    const testToken = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 从localStorage获取令牌
        const token = localStorage.getItem('adminToken');
        if (!token) {
          throw new Error('找不到令牌，请先登录');
        }
        
        // 显示令牌的前15个字符
        console.log('测试令牌:', token.substring(0, 15) + '...');
        
        // 调用测试API
        const response = await fetch('/api/test-auth', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // 解析响应
        const data = await response.json();
        console.log('测试API响应:', data);
        
        // 保存结果
        setTokenInfo(data);
      } catch (err) {
        console.error('测试令牌失败:', err);
        setError(err instanceof Error ? err.message : '测试失败');
      } finally {
        setLoading(false);
      }
    };
    
    testToken();
  }, []);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">JWT令牌测试</h1>
      
      {loading && <p>正在检查令牌...</p>}
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md mb-4">
          <p className="font-bold">错误</p>
          <p>{error}</p>
        </div>
      )}
      
      {tokenInfo && (
        <div className="bg-white p-6 rounded-md shadow-md">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">令牌状态</h2>
            <p className="px-3 py-1 inline-block rounded-full bg-green-100 text-green-800">
              {tokenInfo.success ? '✅ 有效' : '❌ 无效'}
            </p>
          </div>
          
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">令牌数据</h2>
            {tokenInfo.tokenInfo && (
              <div className="bg-gray-100 p-4 rounded-md">
                <p><strong>用户名:</strong> {tokenInfo.tokenInfo.username || '未找到'}</p>
                <p><strong>用户ID:</strong> {tokenInfo.tokenInfo.hasUserId ? tokenInfo.tokenInfo.userId : '未找到'}</p>
                <p><strong>角色:</strong> {tokenInfo.tokenInfo.hasRole ? tokenInfo.tokenInfo.role : '未找到'}</p>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-2">完整令牌数据</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-80">
              {JSON.stringify(tokenInfo.decoded, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 