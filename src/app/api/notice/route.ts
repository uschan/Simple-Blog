import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// 获取每日公告
export async function GET() {
  try {
    // 读取公告JSON文件
    const jsonPath = path.join(process.cwd(), 'src/data/dailyNotice.json');
    const fileContents = await fs.readFile(jsonPath, 'utf8');
    
    // 解析JSON数据
    const data = JSON.parse(fileContents);
    
    if (!data.notice || !data.notice.content) {
      return NextResponse.json({ 
        success: false, 
        error: '公告数据为空' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data.notice 
    });
  } catch (error) {
    console.error('获取每日公告失败:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: '获取每日公告失败' 
    }, { status: 500 });
  }
}

// 更新每日公告
export async function POST(req: Request) {
  try {
    // 解析请求体
    const body = await req.json();
    
    // 验证数据
    if (!body.content) {
      return NextResponse.json({ 
        success: false, 
        error: '公告内容不能为空' 
      }, { status: 400 });
    }
    
    // 读取现有文件
    const jsonPath = path.join(process.cwd(), 'src/data/dailyNotice.json');
    
    // 构建新数据
    const newData = {
      notice: {
        content: body.content,
        date: new Date().toISOString().split('T')[0]
      }
    };
    
    // 写入文件
    await fs.writeFile(jsonPath, JSON.stringify(newData, null, 2), 'utf8');
    
    return NextResponse.json({ 
      success: true, 
      message: '公告已更新',
      data: newData.notice
    });
  } catch (error) {
    console.error('更新公告失败:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: '更新公告失败' 
    }, { status: 500 });
  }
} 