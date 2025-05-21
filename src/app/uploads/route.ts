export const dynamic = 'force-dynamic';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // 获取文件路径参数
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // 移除'/uploads/'前缀以获取相对路径
    let relativePath = pathname.replace(/^\/uploads\//, '');
    
    // 如果路径为空，返回错误
    if (!relativePath) {
      return new NextResponse('无效的文件路径', { status: 400 });
    }
    
    // 确保文件路径不包含尝试访问上级目录的模式
    if (relativePath.includes('..')) {
      return new NextResponse('无效的文件路径', { status: 400 });
    }
    
    // 从外部存储读取文件
    const uploadBasePath = process.env.UPLOAD_BASE_PATH;
    let fileBuffer: Buffer | undefined = undefined;
    let fullPath = '';
    
    // 尝试从外部上传目录读取
    if (uploadBasePath) {
      fullPath = path.join(uploadBasePath, 'uploads', relativePath);
      console.log('尝试从外部上传目录读取文件:', fullPath);
      try {
        fileBuffer = await fs.readFile(fullPath);
        console.log('从外部上传目录成功读取文件');
      } catch (err) {
        console.log('从外部上传目录读取失败，尝试从public目录读取');
      }
    }
    
    // 如果从外部上传目录读取失败，尝试从public目录读取
    if (!fileBuffer) {
      fullPath = path.join(process.cwd(), 'public', 'uploads', relativePath);
      console.log('尝试从public目录读取文件:', fullPath);
      fileBuffer = await fs.readFile(fullPath);
    }
    
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