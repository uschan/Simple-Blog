/**
 * 常量配置
 * 为服务端和客户端组件提供统一的API URL处理
 */

// API基础URL - 客户端使用相对路径
export const API_BASE_URL = '';

// 服务器端API URL - 指向localhost的固定端口
export const SERVER_API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// 获取API URL - 客户端使用
export function getApiUrl(path: string = ''): string {
  // 确保path以/开头
  return path.startsWith('/') ? path : `/${path}`;
}

// 获取服务器端API URL - 服务器组件使用
export function getServerApiUrl(path: string = ''): string {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${SERVER_API_URL}${safePath}`;
}

// 获取绝对URL，在任何环境下都可用
export function getAbsoluteUrl(path: string = ''): string {
  // 确保path以/开头
  const safePath = path.startsWith('/') ? path : `/${path}`;
  
  // 在客户端，使用window.location
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${safePath}`;
  }
  
  // 在服务端，使用环境变量或回退到SERVER_API_URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || SERVER_API_URL;
  return `${baseUrl}${safePath}`;
} 