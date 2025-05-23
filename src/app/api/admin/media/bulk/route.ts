export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Media } from '@/models';
import connectDB from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import { getUploadBasePath } from '@/lib/utils';

// 定义失败项目的接口
interface FailedItem {
  id: string;
  name: string;
  reason: string;
}

/**
 * 批量删除媒体文件的API
 * 接收一个包含要删除的文件ID数组的POST请求
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    // 解析请求体获取要删除的ID数组
    const body = await request.json();
    const { ids } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        message: '请提供有效的文件ID数组'
      }, { status: 400 });
    }
    
    // 获取完整的媒体文件信息，包括文件路径
    const mediaItems = await Media.find({ _id: { $in: ids } });
    
    // 准备失败列表
    const results = {
      total: ids.length,
      deleted: 0,
      failed: 0,
      failedItems: [] as FailedItem[]
    };
    
    // 获取上传基础路径
    const uploadBasePath = getUploadBasePath();
    
    // 一个一个删除文件
    for (const item of mediaItems) {
      try {
        // 1. 尝试删除物理文件
        // 计算文件的完整路径
        const filePath = item.url.startsWith('/') ? item.url.substring(1) : item.url; // 去掉开头的斜杠
        const fullPath = path.join(uploadBasePath, filePath);
        
        try {
          // 检查文件是否存在
          await fs.access(fullPath);
          // 删除物理文件
          await fs.unlink(fullPath);
          console.log(`物理文件删除成功: ${fullPath}`);
        } catch (fileError) {
          console.warn(`物理文件不存在或无法删除: ${fullPath}`, fileError);
          // 物理文件不存在不影响继续删除数据库记录
        }
        
        // 2. 从数据库中删除记录
        await Media.deleteOne({ _id: item._id });
        
        results.deleted++;
      } catch (error) {
        console.error(`删除媒体文件失败 [${item._id}]:`, error);
        results.failed++;
        results.failedItems.push({
          id: item._id.toString(),
          name: item.name,
          reason: error instanceof Error ? error.message : '未知错误'
        });
      }
    }
    
    return NextResponse.json({
      success: results.deleted > 0,
      message: `成功删除 ${results.deleted} 个文件，失败 ${results.failed} 个文件`,
      results
    });
    
  } catch (error) {
    console.error('批量删除媒体文件失败:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '批量删除文件时出错'
    }, { status: 500 });
  }
} 