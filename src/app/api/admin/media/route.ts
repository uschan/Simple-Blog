export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import connectDB from '@/lib/db';
import { Media } from '@/models';

// 确保上传目录存在
async function ensureUploadDir(targetDir = 'uploads') {
  // 使用环境变量中的外部上传路径，如果未设置则回退到项目内的public目录
  const baseDir = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'public');
  const uploadDir = path.join(baseDir, targetDir);
  
  try {
    await fs.promises.access(uploadDir);
  } catch (error) {
    await mkdir(uploadDir, { recursive: true });
  }
  
  return uploadDir;
}

// 获取所有媒体文件
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 获取URL查询参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const type = url.searchParams.get('type') || undefined;
    const search = url.searchParams.get('search') || undefined;
    
    // 构建查询条件
    const query: any = {};
    if (type) query.type = type;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // 计算分页
    const skip = (page - 1) * limit;
    
    // 查询总数
    const total = await Media.countDocuments(query);
    
    // 查询媒体文件
    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // 格式化结果
    const formattedMedia = media.map(item => ({
      id: (item._id as any).toString(),
      type: item.type,
      name: item.name,
      url: item.url,
      size: formatFileSize(item.size),
      date: formatDate(item.date || item.createdAt),
      width: item.width,
      height: item.height,
      mimeType: item.mimeType,
      rawSize: item.size
    }));
    
    return NextResponse.json({ 
      success: true,
      data: formattedMedia,
        pagination: {
          page,
          limit,
        total,
          totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('获取媒体文件失败:', error);
    return NextResponse.json(
      { success: false, message: '获取媒体文件失败', error: error.message },
      { status: 500 }
    );
  }
}

// 上传媒体文件
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    
    if (!file) {
      return NextResponse.json(
        { message: '未提供文件' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { message: '缺少上传用户ID' },
        { status: 400 }
      );
    }
    
    // 获取文件Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 创建按年/月日结构的目录
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    const day = String(now.getDate()).padStart(2, '0');
    const targetDir = `uploads/${year}/${month}-${day}`;
    
    // 生成唯一文件名
    const fileExt = path.extname(file.name);
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}${fileExt}`;
    const uploadDir = await ensureUploadDir(targetDir);
    const filePath = path.join(uploadDir, fileName);
    
    // 写入文件
    await writeFile(filePath, buffer);
    
    // 保存文件信息到数据库
    // 生成URL路径（使用环境变量中设置的URL前缀）
    const urlPrefix = process.env.NEXT_PUBLIC_UPLOAD_URL || '';
    const mediaPath = `/${targetDir}/${fileName}`;
    
    const mediaInfo = {
      fileName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      path: mediaPath,
      url: mediaPath,
      uploadedBy: userId
    };
    
    const media = new Media(mediaInfo);
    await media.save();
    
    return NextResponse.json({ 
      message: '文件上传成功',
      data: media
    }, { status: 201 });
  } catch (error: any) {
    console.error('上传文件失败:', error);
    return NextResponse.json(
      { message: '上传文件失败', error: error.message },
      { status: 500 }
    );
  }
}

// 删除媒体文件
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    // 检查环境，开发环境下跳过权限验证
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 如果不是开发环境，验证JWT令牌
    if (!isDevelopment) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, message: '未授权访问' },
          { status: 401 }
        );
      }
      
      // 验证令牌
      try {
        const token = authHeader.substring(7);
        const { verifyToken } = await import('@/lib/jwt');
        const decoded = await verifyToken(token);
        
        if (!decoded || !decoded.userId) {
          return NextResponse.json(
            { success: false, message: '无效的认证令牌' },
            { status: 401 }
          );
        }
      } catch (tokenError) {
        console.error('令牌验证失败:', tokenError);
        return NextResponse.json(
          { success: false, message: '认证失败' },
          { status: 401 }
        );
      }
    }
    
    // 获取要删除的文件ID
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 查找并删除媒体文件
    const media = await Media.findByIdAndDelete(id);
    
    if (!media) {
      return NextResponse.json(
        { success: false, message: '文件不存在' },
        { status: 404 }
      );
    }
    
    // 如果文件存在物理文件，也尝试删除
    try {
      // 首先尝试从外部上传目录删除
      const uploadBasePath = process.env.UPLOAD_BASE_PATH;
      let filePath = '';
      
      if (uploadBasePath && media.url) {
        // 从URL中提取相对路径部分（去掉开头的斜杠）
        const relativePath = media.url.startsWith('/') ? media.url.substring(1) : media.url;
        filePath = path.join(uploadBasePath, relativePath);
        
        // 检查文件是否存在，如果存在则删除
        if (fs.existsSync(filePath)) {
          console.log('从外部存储删除文件:', filePath);
          fs.unlinkSync(filePath);
          console.log('文件删除成功');
        }
      }
      
      // 如果从外部存储删除失败或未找到文件，尝试从public目录删除
      if (media.url) {
        filePath = path.join(process.cwd(), 'public', media.url);
        
        // 检查文件是否存在，如果存在则删除
        if (fs.existsSync(filePath)) {
          console.log('从public目录删除文件:', filePath);
          fs.unlinkSync(filePath);
          console.log('文件删除成功');
        }
      }
    } catch (err) {
      console.warn('删除物理文件失败，仅删除了数据库记录:', err);
    }
    
    return NextResponse.json({ 
      success: true,
      message: '文件已成功删除'
    });
  } catch (error: any) {
    console.error('删除媒体文件失败:', error);
    return NextResponse.json(
      { success: false, message: '删除媒体文件失败', error: error.message },
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
  return new Date(date).toISOString().split('T')[0];
} 