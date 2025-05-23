export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * 处理上传文件直接访问的路由
 * 处理路径: /uploads/年/月-日/文件名
 */
export async function GET(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  try {
    // 获取文件路径 - 先await context.params再使用path属性
    const params = await context.params;
    const pathSegments = params.path;
    const filePath = pathSegments.join('/');
    
    // 确保路径不包含尝试访问上级目录的模式
    if (filePath.includes('..')) {
      return new NextResponse('无效的文件路径', { status: 400 });
    }
    
    // 获取外部上传目录路径
    const uploadBasePath = process.env.UPLOAD_BASE_PATH;
    if (!uploadBasePath) {
      console.error('未配置UPLOAD_BASE_PATH环境变量');
      return new NextResponse('服务器配置错误', { status: 500 });
    }
    
    // 构建完整文件路径
    const fullPath = path.join(uploadBasePath, 'uploads', filePath);
    
    // 读取文件
    const fileBuffer = await readFile(fullPath);
    
    // 根据文件扩展名设置内容类型
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    } else if (ext === '.svg') {
      contentType = 'image/svg+xml';
    } else if (ext === '.mp4') {
      contentType = 'video/mp4';
    } else if (ext === '.webm') {
      contentType = 'video/webm';
    } else if (ext === '.pdf') {
      contentType = 'application/pdf';
    }
    
    // 返回文件内容
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (error) {
    console.error('读取文件失败:', error);
    return new NextResponse('文件未找到', { status: 404 });
  }
} 