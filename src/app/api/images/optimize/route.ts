import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import { existsSync } from 'fs';
import { readFile, stat } from 'fs/promises';
import { getUploadBasePath } from '@/lib/utils';

// 设置为动态路由
export const dynamic = 'force-dynamic';

// 最大图片宽度
const MAX_WIDTH = 1200;

/**
 * 优化图片API路由
 * 支持以下参数:
 * - path: 图片路径
 * - width: 输出宽度（可选，默认根据原始比例自动计算）
 * - format: 输出格式（可选，支持webp, jpeg, png, avif）
 * - quality: 输出质量（可选，1-100，默认80）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get('path');
    
    if (!imagePath) {
      return new NextResponse('缺少图片路径', { status: 400 });
    }
    
    // 清理路径
    const sanitizedPath = imagePath
      .replace(/\.\./g, '')
      .replace(/\/\//g, '/')
      .replace(/^\//, '');
    
    // 获取请求的参数
    const requestedWidth = searchParams.get('width') 
      ? parseInt(searchParams.get('width') || '0') 
      : 0;
    const format = searchParams.get('format') || 'webp';
    const quality = searchParams.get('quality') 
      ? parseInt(searchParams.get('quality') || '80') 
      : 80;
    
    // 验证格式
    if (!['webp', 'jpeg', 'png', 'avif'].includes(format)) {
      return new NextResponse('不支持的图片格式', { status: 400 });
    }
    
    // 验证质量范围
    if (quality < 1 || quality > 100) {
      return new NextResponse('质量参数必须在1-100范围内', { status: 400 });
    }
    
    // 查找文件 - 优先检查上传目录
    let filePath;
    const isUploadPath = sanitizedPath.startsWith('uploads/');

    // 如果是上传目录的路径，先尝试从上传目录查找
    if (isUploadPath) {
      const uploadBasePath = getUploadBasePath();
      const uploadFilePath = path.join(uploadBasePath, sanitizedPath);
      
      if (existsSync(uploadFilePath)) {
        filePath = uploadFilePath;
        console.log('找到上传目录中的文件:', uploadFilePath);
      }
    }
    
    // 如果没找到，尝试标准路径
    if (!filePath) {
      const standalonePublicPath = path.join(process.cwd(), '.next', 'standalone', 'public', sanitizedPath);
      const regularPublicPath = path.join(process.cwd(), 'public', sanitizedPath);
      
      if (existsSync(standalonePublicPath)) {
        filePath = standalonePublicPath;
        console.log('找到standalone目录中的文件:', standalonePublicPath);
      } else if (existsSync(regularPublicPath)) {
        filePath = regularPublicPath;
        console.log('找到public目录中的文件:', regularPublicPath);
      }
    }
    
    // 如果仍然找不到文件，返回404
    if (!filePath) {
      console.error('图片未找到:', sanitizedPath);
      return new NextResponse('图片未找到', { status: 404 });
    }
    
    // 读取图片
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) {
      return new NextResponse('不是有效的文件', { status: 400 });
    }
    
    const fileBuffer = await readFile(filePath);
    
    // 使用sharp处理图片
    let sharpInstance = sharp(fileBuffer);
    
    // 获取图片信息
    const metadata = await sharpInstance.metadata();
    const originalWidth = metadata.width || 0;
    
    // 计算输出宽度
    let outputWidth = requestedWidth;
    if (outputWidth <= 0 || outputWidth > MAX_WIDTH) {
      outputWidth = Math.min(originalWidth, MAX_WIDTH);
    }
    
    // 转换图片
    sharpInstance = sharpInstance.resize({
      width: outputWidth,
      withoutEnlargement: true, // 防止放大图片
    });
    
    // 根据请求的格式输出
    let outputBuffer;
    switch (format) {
      case 'webp':
        outputBuffer = await sharpInstance.webp({ quality }).toBuffer();
        break;
      case 'jpeg':
        outputBuffer = await sharpInstance.jpeg({ quality }).toBuffer();
        break;
      case 'png':
        outputBuffer = await sharpInstance.png({ quality }).toBuffer();
        break;
      case 'avif':
        outputBuffer = await sharpInstance.avif({ quality }).toBuffer();
        break;
      default:
        outputBuffer = await sharpInstance.webp({ quality }).toBuffer();
    }
    
    // 设置内容类型
    let contentType;
    switch (format) {
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'avif':
        contentType = 'image/avif';
        break;
      default:
        contentType = 'image/webp';
    }
    
    // 返回优化后的图片
    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': outputBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // 缓存一年
      },
    });
  } catch (error) {
    console.error('处理图片优化请求时出错:', error);
    return new NextResponse('服务器内部错误', { status: 500 });
  }
} 