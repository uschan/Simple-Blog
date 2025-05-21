export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    // 获取请求体
    const body = await request.json();
    
    // 验证数据格式
    if (!body.quotes || !Array.isArray(body.quotes)) {
      return NextResponse.json(
        { error: '无效的数据格式' },
        { status: 400 }
      );
    }
    
    // 设置文件路径
    const filePath = path.join(process.cwd(), 'src/data/shareQuotes.json');
    
    // 准备写入的数据
    const dataToSave = {
      quotes: body.quotes,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    // 写入文件
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存语录失败:', error);
    return NextResponse.json(
      { error: '保存过程中出错' },
      { status: 500 }
    );
  }
} 