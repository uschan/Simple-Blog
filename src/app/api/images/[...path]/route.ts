export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { stat, readFile } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * 处理图片请求的API路由
 * 支持两种格式:
 * 1. /api/images/path/to/image.jpg
 * 2. /api/images?path=path/to/image.jpg
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    let imagePath: string;
    const { searchParams } = new URL(req.url);
    const queryPath = searchParams.get('path');

    // 优先使用查询参数中的路径
    if (queryPath) {
      imagePath = queryPath;
    } else {
      // 否则使用路径参数
      imagePath = params.path.join('/');
    }

    // 确保路径不包含任何尝试跳出公共目录的部分
    const sanitizedPath = imagePath
      .replace(/\.\./g, '')
      .replace(/\/\//g, '/')
      .replace(/^\//, '');

    // 构建完整的文件路径
    // 首先检查生产环境的standalone文件夹
    const standalonePublicPath = join(process.cwd(), '.next', 'standalone', 'public', sanitizedPath);
    const regularPublicPath = join(process.cwd(), 'public', sanitizedPath);
    
    let filePath: string;
    
    // 检查文件是否存在于standalone目录
    if (existsSync(standalonePublicPath)) {
      filePath = standalonePublicPath;
    } 
    // 检查文件是否存在于常规public目录
    else if (existsSync(regularPublicPath)) {
      filePath = regularPublicPath;
    } else {
      // 文件不存在
      console.error(`文件不存在: ${sanitizedPath}`);
      return new NextResponse('图片未找到', { status: 404 });
    }

    try {
      // 获取文件信息
      const fileInfo = await stat(filePath);
      
      if (!fileInfo.isFile()) {
        return new NextResponse('不是有效的文件', { status: 400 });
      }

      // 读取文件内容
      const fileBuffer = await readFile(filePath);

      // 根据文件扩展名设置正确的内容类型
      const extension = filePath.split('.').pop()?.toLowerCase() || '';
      let contentType = 'application/octet-stream';
      
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'webp':
          contentType = 'image/webp';
          break;
        case 'svg':
          contentType = 'image/svg+xml';
          break;
        case 'mp4':
          contentType = 'video/mp4';
          break;
        case 'webm':
          contentType = 'video/webm';
          break;
        case 'pdf':
          contentType = 'application/pdf';
          break;
      }

      // 返回文件内容
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileInfo.size.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable', // 缓存一年
        },
      });
    } catch (error) {
      console.error('读取文件时出错:', error);
      return new NextResponse('读取文件失败', { status: 500 });
    }
  } catch (error) {
    console.error('处理图片请求时出错:', error);
    return new NextResponse('服务器内部错误', { status: 500 });
  }
} 