/**
 * API请求工具 - 封装了认证逻辑和路径配置
 */

import { getServerApiUrl } from '@/lib/constants';

// 后台API基础路径
const API_BASE = '/api';

/**
 * 获取认证头
 * @returns 包含认证令牌的请求头对象
 */
export const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  
  const token = localStorage.getItem('adminToken');
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * 发送API请求，自动处理认证
 * @param endpoint API端点路径
 * @param options 请求选项
 * @returns 请求响应
 */
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // 确保endpoint以/开头
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // 判断是否为管理员API
  const isAdminApi = normalizedEndpoint.includes('/admin');
  
  // 构建完整的URL
  const url = normalizedEndpoint.startsWith('/api') 
    ? normalizedEndpoint
    : `${API_BASE}${normalizedEndpoint.replace(/^\/api/, '')}`;
    // : `${API_BASE}${normalizedEndpoint}`;
    
  // 创建新的headers对象
  const headers = new Headers();
  
  // 首先复制传入的headers
  if (options.headers) {
    if (options.headers instanceof Headers) {
      // 如果是Headers对象，逐个复制每个头
      options.headers.forEach((value, key) => {
        headers.set(key, value);
      });
    } else {
      // 如果是普通对象
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers.set(key, value);
        }
      });
    }
  }
  
  // 如果是管理员API，添加认证头
  if (isAdminApi && typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('[API Debug] 警告: 访问管理员API但未找到令牌');
    }
  }
  
  // 确保设置内容类型
  if (!headers.has('Content-Type') && !url.includes('/upload')) {
    headers.set('Content-Type', 'application/json');
  }
    
    // 日志输出已禁用
  
  // 构建最终的请求选项
  const finalOptions = {
    ...options,
    headers
  };
  
  try {
    // 发送请求
    const response = await fetch(url, finalOptions);
    
    // 打印响应状态
    // console.log(`[API] 响应状态: ${response.status} ${response.statusText}`);
    
    // 处理未授权错误
    if (response.status === 401 && typeof window !== 'undefined') {
      console.error('[API] 未授权访问，可能需要重新登录');
      // 可能需要重定向到登录页
      if (isAdminApi && window.location.pathname.startsWith('/admin') && 
          !window.location.pathname.includes('/login')) {
        // 清除登录信息
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminLoggedIn');
        
        // 建议重定向到登录页
        console.warn('[API] 已清除登录信息，建议重新登录');
      }
    }
    
    // 解析响应JSON
    let data: any = {};
    try {
      data = await response.json();
    } catch (e) {
      console.warn('[API] 响应不是有效的JSON格式:', e);
    }
    
    if (!response.ok) {
      const errorMessage = data && typeof data === 'object' && 'message' in data 
        ? data.message 
        : `请求失败 (${response.status})`;
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error('[API] 请求失败:', error);
    throw error;
  }
};

/**
 * GET请求
 */
export const get = (endpoint: string, options: RequestInit = {}) => {
  // 创建新的headers对象以添加缓存控制
  const headers = new Headers(options.headers);
  
  // 对GET请求添加缓存控制头
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  
  // 合并修改后的headers到options
  const newOptions = {
    ...options,
    headers,
  };
  
  return apiRequest(endpoint, { ...newOptions, method: 'GET' });
};

/**
 * POST请求
 */
export const post = (endpoint: string, data: any, options: RequestInit = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  });
};

/**
 * PUT请求
 */
export const put = (endpoint: string, data: any, options: RequestInit = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

/**
 * DELETE请求
 */
export const del = (endpoint: string, options: RequestInit = {}) => {
  // 如果提供了body但没有Content-Type，确保正确设置
  const headers = new Headers(options.headers);
  
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // 合并修改后的headers到options
  const finalOptions = {
    ...options,
    headers
  };
  
  return apiRequest(endpoint, { ...finalOptions, method: 'DELETE' });
};

/**
 * 上传文件 - 专门处理文件上传请求，支持FormData
 * @param endpoint API端点路径
 * @param formData 表单数据
 * @returns 请求响应
 */
export const uploadFile = async (endpoint: string, formData: FormData) => {
  // 确保endpoint以/开头
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // 判断是否为管理员API
  const isAdminApi = normalizedEndpoint.includes('/admin');
  
  // 构建完整的URL
  const url = normalizedEndpoint.startsWith('/api') 
    ? normalizedEndpoint
    : `${API_BASE}${normalizedEndpoint}`;
  
  // 创建新的headers对象 - 对于文件上传不设置Content-Type，让浏览器自动设置
  const headers = new Headers();
  
  // 如果是管理员API，添加认证头
  if (isAdminApi && typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // console.log(`[API Upload] 使用令牌: ${token.substring(0, 15)}...`);
      // console.log(`[API Upload] 完整认证头: Bearer ${token}`);
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.error('[API Upload] 错误: 访问管理员API但未找到令牌，这将导致未授权错误');
    }
  }
  
  // console.log(`[API] 上传文件: POST ${url}`);
  
  // 构建请求选项
  const options = {
    method: 'POST',
    headers,
    body: formData,
    // 添加这些选项来改善连接
    mode: 'cors' as RequestMode,
    credentials: 'same-origin' as RequestCredentials,
    timeout: 30000 // 虚拟属性，实际fetch API不支持，但有助于提醒超时处理
  };
  
  // 尝试重试机制
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: any = null;
  
  while (retryCount < maxRetries) {
    try {
      // 发送请求
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
      
      // 添加信号控制器
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };
      
      const response = await fetch(url, fetchOptions);
      
      // 清除超时计时器
      clearTimeout(timeoutId);
      
      // 打印响应状态
      // console.log(`[API] 响应状态: ${response.status} ${response.statusText}`);
      
      // 处理未授权错误
      if (response.status === 401 && typeof window !== 'undefined') {
        console.error('[API] 未授权访问，可能需要重新登录');
        if (isAdminApi && window.location.pathname.startsWith('/admin') && 
            !window.location.pathname.includes('/login')) {
          // 清除登录信息
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          localStorage.removeItem('adminLoggedIn');
          
          console.warn('[API] 已清除登录信息，建议重新登录');
        }
      }
      
      // 解析响应JSON
      let data: any = {};
      try {
        data = await response.json();
      } catch (e) {
        console.warn('[API] 响应不是有效的JSON格式:', e);
      }
      
      if (!response.ok) {
        const errorMessage = data && typeof data === 'object' && 'message' in data 
          ? data.message 
          : `上传失败 (${response.status})`;
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      lastError = error;
      retryCount++;
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn(`[API] 网络连接失败，正在重试 (${retryCount}/${maxRetries})...`);
        // 等待一段时间后重试，使用指数退避
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
      } else {
        // 对于非网络错误，不重试
        break;
      }
    }
  }
  
  // 所有重试都失败
  console.error('[API] 上传文件失败，已重试多次:', lastError);
  throw lastError;
};

/**
 * 前台GET请求 - 无需认证，支持缓存选项
 * 主要用于前台页面获取数据
 */
export const publicGet = async (endpoint: string, options: RequestInit = {}) => {
  // 确保endpoint以/开头
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // 构建完整的URL
  const url = normalizedEndpoint.startsWith('/api') 
    ? normalizedEndpoint
    : `${API_BASE}${normalizedEndpoint}`;
  
  try {
    // 发送请求
    const response = await fetch(url, {
      ...options,
      method: 'GET'
    });
    
    // 如果响应不成功
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `请求失败 (${response.status})`;
      throw new Error(errorMessage);
    }
    
    // 解析响应JSON
    return await response.json();
  } catch (error) {
    console.error('[前台API] 请求失败:', error);
    throw error;
  }
};

/**
 * 服务端API GET请求 - 主要用于服务端组件，保持与现有代码一致性
 * @param path API路径
 * @param options 请求选项
 */
export const serverFetch = async (path: string, options: RequestInit = {}) => {
  try {
    const apiUrl = getServerApiUrl(path);
    const response = await fetch(apiUrl, options);
    // console.log('API URL:', apiUrl); 
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[服务端API] 请求失败:', error);
    throw error;
  }
};

// 获取随机分享语录
export async function getRandomQuote() {
  try {
    const response = await get('/api/quotes/random');
    return response;
  } catch (error) {
    console.error('获取随机语录失败:', error);
    return { success: false, error: '获取随机语录失败' };
  }
}

// 获取每日公告
export async function getDailyNotice() {
  try {
    const response = await get('/api/notice');
    return response;
  } catch (error) {
    console.error('获取每日公告失败:', error);
    return { success: false, error: '获取每日公告失败' };
  }
}

// 更新每日公告
export async function updateDailyNotice(content: string) {
  try {
    const response = await post('/api/notice', { content });
    return response;
  } catch (error) {
    console.error('更新每日公告失败:', error);
    return { success: false, error: '更新每日公告失败' };
  }
} 