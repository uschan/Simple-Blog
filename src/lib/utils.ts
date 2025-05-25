import path from 'path';/** * 确保路径是相对路径 * 如果是完整URL，则提取出路径部分 * 如果已经是相对路径，则保持不变 */
export function ensureRelativePath(path: string): string {
  if (!path) return '';
  
  try {
    // 检查是否是完整URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
      const url = new URL(path);
      return url.pathname; // 返回路径部分
    }
    
    // 确保路径以/开头
    return path.startsWith('/') ? path : `/${path}`;
  } catch (error) {
    console.error('处理路径失败:', error);
    return path; // 出错时返回原始路径
  }
}

/**
 * 获取当前窗口的origin
 * 在客户端使用window.location.origin
 * 在服务器端返回空字符串或提供的默认值
 */
export function getCurrentOrigin(defaultOrigin = ''): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return defaultOrigin;
}

/**
 * 构建完整URL
 * 如果path已经是完整URL，则直接返回
 * 否则将path附加到当前origin
 */
export function buildFullUrl(path: string): string {
  if (!path) return '';
  
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 确保path以/开头
  const relativePath = path.startsWith('/') ? path : `/${path}`;
  
  // 在客户端，使用window.location.origin
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${relativePath}`;
  }
  
  // 在服务器端，返回相对路径
  return relativePath;
}

/**
 * 从HTML字符串中提取FontAwesome或类似图标的className
 * 用于避免使用dangerouslySetInnerHTML
 */
export function extractIconClass(iconHtml: string): string {
  if (!iconHtml) return 'fas fa-link'; // 默认图标
  
  try {
    // 提取class属性值
    const classMatch = iconHtml.match(/class="([^"]+)"/);
    if (classMatch && classMatch[1]) {
      return classMatch[1];
    }
    
    // 如果没有class属性但有fa-前缀的类，提取它
    const faMatch = iconHtml.match(/fa[srlbd]?-[a-z-]+/);
    if (faMatch) {
      return `fas ${faMatch[0]}`;
    }
  } catch (error) {
    console.error('提取图标类名失败:', error);
  }
  
  // 默认返回一个链接图标
  return 'fas fa-link';
}

/**
 * 转换图片URL为API路由URL
 * 这对于解决Next.js图像组件无法访问静态文件的问题很有用
 */
export function convertToApiImageUrl(url: string): string {
  // 如果URL为空或undefined，直接返回空字符串
  if (!url) return '';
  
  // 如果已经是API路径，直接返回
  if (url.startsWith('/api/images') || url.includes('/api/images?path=')) {
    return url;
  }
  
  // 忽略外部URL和公共静态资源
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 如果是上传目录的路径，不进行转换（由uploads路由处理）
  if (url.startsWith('/uploads/')) {
    return url;
  }
  
  try {
    // 移除开头的斜杠以确保路径正确
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    
    // 使用相对URL，确保服务端和客户端一致
    return `/api/images?path=${encodeURIComponent(cleanPath)}`;
  } catch (error) {
    console.error('图片URL转换错误:', error, url);
    // 出错时返回原始URL
    return url;
  }
}

/**
 * 生成优化的图片URL
 * @param url 原始图片URL
 * @param options 优化选项
 * @returns 优化后的图片URL
 */
export function getOptimizedImageUrl(
  url: string, 
  options: {
    width?: number;
    format?: 'webp' | 'jpeg' | 'png' | 'avif';
    quality?: number;
  } = {}
): string {
  // 如果URL为空，返回空字符串
  if (!url) return '';
  
  // 外部URL不进行处理
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  try {
    // 清理路径
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    
    // 构建API URL - 总是使用相对路径，避免客户端/服务端不一致
    let apiUrl = `/api/images/optimize?path=${encodeURIComponent(cleanPath)}`;
    
    // 添加优化参数
    if (options.width) {
      apiUrl += `&width=${options.width}`;
    }
    
    if (options.format) {
      apiUrl += `&format=${options.format}`;
    }
    
    if (options.quality) {
      apiUrl += `&quality=${options.quality}`;
    }
    
    return apiUrl;
  } catch (error) {
    console.error('优化图片URL生成错误:', error, url);
    return url;
  }
}

/**
 * 获取服务器上的上传目录路径
 * 根据环境变量UPLOAD_BASE_PATH获取外部上传目录
 * 如果未设置环境变量，回退到项目内部的public目录
 */
export function getUploadBasePath(): string {
  // 检查环境变量是否存在
  const uploadBasePath = process.env.UPLOAD_BASE_PATH;
  
  if (uploadBasePath) {
    return uploadBasePath;
  } else {
    // 如果未设置环境变量，回退到项目内的public目录
    return path.join(process.cwd(), 'public');
  }
}

/**
 * 获取上传文件的URL路径前缀
 */
export function getUploadUrlPrefix(): string {
  return process.env.NEXT_PUBLIC_UPLOAD_URL || '/uploads';
} 