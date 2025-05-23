export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * 静态文件服务API
 * 直接提供上传目录中的文件
 */
export async function GET(request: NextRequest) {
  console.log('[Static API] 收到请求URL:', request.url);
  
  // 获取要访问的文件路径 - 使用原始URL以确保获取所有查询参数
  const url = new URL(request.url);
  console.log('[Static API] 所有查询参数:', Object.fromEntries(url.searchParams.entries()));
  
  const filePath = url.searchParams.get('path');
  console.log('[Static API] 请求文件路径:', filePath);
  
  if (!filePath) {
    console.error('[Static API] 错误: 缺少文件路径参数');
    return NextResponse.json({ error: '缺少文件路径参数' }, { status: 400 });
  }
  
  try {
    // 获取外部上传目录路径
    const uploadBasePath = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'public');
    console.log('[Static API] 使用基础路径:', uploadBasePath);
    
    // 构建完整文件路径
    const fullPath = path.join(uploadBasePath, filePath);
    console.log('[Static API] 完整文件路径:', fullPath);
    
    // 检查文件是否存在
    if (!existsSync(fullPath)) {
      console.log('[Static API] 外部文件不存在，尝试public目录');
      // 如果外部文件不存在，尝试在public目录中查找
      const publicPath = path.join(process.cwd(), 'public', filePath);
      
      if (existsSync(publicPath)) {
        console.log('[Static API] 文件在public目录中存在:', publicPath);
        // 使用public目录中的文件
        return serveFile(publicPath);
      }
      
      // 文件不存在
      console.error('[Static API] 文件不存在:', fullPath, publicPath);
      return NextResponse.json({ 
        error: '文件不存在',
        path: filePath,
        tries: [fullPath, publicPath]
      }, { status: 404 });
    }
    
    console.log('[Static API] 文件存在，准备发送');
    return serveFile(fullPath);
  } catch (error) {
    console.error('[Static API] 错误:', error);
    return NextResponse.json({
      error: '文件访问错误',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

/**
 * 读取并提供文件
 */
async function serveFile(filePath: string) {
  try {
    // 读取文件内容
    const fileBuffer = await readFile(filePath);
    
    // 获取文件扩展名
    const ext = path.extname(filePath).toLowerCase();
    
    // 根据扩展名设置内容类型
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.mp4':
        contentType = 'video/mp4';
        break;
      case '.webm':
        contentType = 'video/webm';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
    }
    
    console.log(`[Static API] 发送文件 (${contentType}), 大小: ${fileBuffer.length} 字节`);
    
    // 返回文件内容
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (error) {
    console.error('[Static API] 读取文件失败:', error);
    throw error;
  }
} 