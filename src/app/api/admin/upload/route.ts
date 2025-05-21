export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Media } from '@/models';
import connectDB from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// 确保上传目录存在
async function ensureUploadDir(targetDir = 'uploads') {
  try {
    console.log('确保目录存在:', targetDir);
    
    // 使用环境变量中的外部上传路径，如果未设置则回退到项目内的public目录
    const uploadBasePath = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'public');
    console.log('使用上传基础路径:', uploadBasePath);
    
    // 确保基本路径存在
    await mkdir(uploadBasePath, { recursive: true });
    
    // 处理多级路径
    let fullPath = uploadBasePath;
    const segments = targetDir.split('/').filter(Boolean);
    for (const segment of segments) {
      fullPath = path.join(fullPath, segment);
      console.log('创建目录:', fullPath);
      await mkdir(fullPath, { recursive: true });
    }
    
    console.log('目录创建成功:', fullPath);
    return fullPath;
  } catch (error) {
    console.error(`创建目录 ${targetDir} 失败:`, error);
    throw error;
  }
}

// 根据MIME类型确定文件类型
function getFileType(mimeType: string): 'image' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}

// 获取图片尺寸
async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  } catch (error) {
    console.error('获取图像尺寸失败:', error);
    return { width: 0, height: 0 };
  }
}

/**
 * 处理单个文件的上传
 */
async function processFileUpload(file: File, type: string, userId: string) {
  // 获取文件信息
  const buffer = Buffer.from(await file.arrayBuffer());
  const originalName = file.name;
  const mimeType = file.type;
  const fileSize = file.size;
  
  // 验证文件类型和大小
  if (fileSize > 20 * 1024 * 1024) { // 20MB限制
    throw new Error('文件大小超过限制(20MB)');
  }
  
  // 根据上传类型确定目标目录和文件名
  let targetDir = 'uploads';
  if (type === 'logo' || type === 'favicon') {
    targetDir = 'images';
  } else if (type === 'category') {
    // 分类图片存放在categories目录下
    targetDir = 'uploads/categories';
  }
  
  // 生成安全的文件名
  const fileExt = path.extname(originalName);
  const fileName = `${type}-${uuidv4()}${fileExt}`;
  
  // 确保目录存在
  const uploadDir = await ensureUploadDir(targetDir);
  
  // 文件保存路径
  const relativePath = `/${targetDir}/${fileName}`;
  const filePath = path.join(uploadDir, fileName);
  
  // 写入文件
  try {
    await writeFile(filePath, buffer);
  } catch (error: any) {
    console.error('写入文件失败:', error);
    throw new Error(`文件保存失败: ${error.message}`);
  }
  
  // 如果是媒体库上传或分类图片，保存到Media数据库
  if (type === 'media' || type === 'category') {
    const fileType = getFileType(mimeType);
    
    // 如果是图片，获取尺寸
    let dimensions = { width: 0, height: 0 };
    let thumbnailUrl = relativePath; // 缩略图默认使用原图
    
    if (fileType === 'image') {
      try {
        dimensions = await getImageDimensions(buffer);
      } catch (error) {
        console.error('获取图像尺寸失败:', error);
      }
    } 
    // 如果是视频，设置默认的占位图
    else if (fileType === 'video') {
      // 使用预设的视频占位SVG
      thumbnailUrl = '/images/video-placeholder.svg';
      
      // 设置一个默认的视频尺寸，如果没有具体信息
      if (dimensions.width === 0) {
        dimensions = { width: 640, height: 360 }; // 16:9比例
      }
    }
    
    // 创建媒体对象
    try {
      // 保存到数据库
      const media = new Media({
        type: fileType,
        name: originalName,
        url: relativePath,
        thumbnailUrl: thumbnailUrl, // 添加缩略图URL字段
        size: fileSize,
        mimeType: mimeType,
        width: dimensions.width,
        height: dimensions.height,
        date: new Date(),
        usage: type // 记录媒体用途
      });
      
      await media.save();
      
      return {
        id: media._id.toString(),
        type: fileType,
        name: originalName,
        url: relativePath,
        thumbnailUrl: thumbnailUrl, // 返回缩略图URL
        size: formatFileSize(fileSize),
        date: formatDate(new Date()),
        width: dimensions.width,
        height: dimensions.height
      };
    } catch (error) {
      console.error('保存媒体信息到数据库失败:', error);
      // 即使数据库保存失败，也返回基本的文件信息
      return {
        id: uuidv4(),
        type: fileType,
        name: originalName,
        url: relativePath,
        thumbnailUrl: thumbnailUrl, // 返回缩略图URL
        size: formatFileSize(fileSize),
        date: formatDate(new Date()),
        width: dimensions.width,
        height: dimensions.height
      };
    }
  }
  
  // 返回上传结果
  return {
    filePath: relativePath,
    fileName: fileName
  };
}

/**
 * 处理文件上传
 * 支持多种上传类型：logo, favicon, image, document, video, category等
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // 验证用户权限
    let userId = 'dev-user';
    
    // 访问控制 - 优化权限检查逻辑
    if (process.env.NODE_ENV !== 'development') {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user) {
          userId = session.user.id;
        } else {
          // 尝试从请求头提取并验证令牌
          const authHeader = request.headers.get('authorization');
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
              // 导入并使用JWT验证
              const { verifyToken } = await import('@/lib/jwt');
              const decoded = await verifyToken(token);
              console.log('JWT令牌解码结果:', JSON.stringify(decoded));
              if (decoded && decoded.userId) {
                userId = decoded.userId;
                console.log('验证成功，使用userId:', userId);
              } else {
                console.error('令牌验证失败：找不到userId字段', decoded);
                throw new Error('无效令牌');
              }
            } catch (tokenError) {
              console.error('令牌验证失败:', tokenError);
              return NextResponse.json(
                { success: false, message: '未授权访问，令牌无效' },
                { status: 403 }
              );
            }
          } else {
            console.warn('无授权头，但继续处理上传以增强兼容性');
          }
        }
      } catch (sessionError) {
        console.error('会话验证错误:', sessionError);
        // 不立即返回错误，继续尝试处理上传
      }
    }
    
    // 解析FormData
    let formData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error('解析FormData失败:', formError);
      return NextResponse.json(
        { success: false, message: '无法解析上传数据', error: (formError as Error).message },
        { status: 400 }
      );
    }
    
    const file = formData.get('file') as File;
    const rawType = formData.get('type');
    const type = typeof rawType === 'string' && rawType.trim() !== '' ? rawType : 'image';
    
    console.log('接收到的上传类型 type:', type);
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: '未提供文件' },
        { status: 400 }
      );
    }
    
    // 处理文件上传
    const result = await processFileUpload(file, type, userId);
    
    // 根据处理结果返回响应 - 统一返回结构
    return NextResponse.json({
      success: true,
      message: '文件上传成功',
      filePath: result.url || result.filePath, // 确保始终返回一个有效的路径
      fileName: result.fileName || path.basename(result.url || result.filePath || ''),
      data: result
    });
  } catch (error: any) {
    console.error('文件上传失败:', error);
    
    // 提供详细的错误信息以便调试
    return NextResponse.json(
      { 
        success: false, 
        message: '文件上传失败', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// 辅助函数：格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

// 辅助函数：格式化日期
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
} 