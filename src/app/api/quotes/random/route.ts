import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET() {
  try {
    // 读取语录JSON文件
    const jsonPath = path.join(process.cwd(), 'src/data/shareQuotes.json');
    const fileContents = await fs.readFile(jsonPath, 'utf8');
    
    // 解析JSON数据
    const data = JSON.parse(fileContents);
    
    if (!data.quotes || !Array.isArray(data.quotes) || data.quotes.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '语录数据为空' 
      }, { status: 404 });
    }
    
    // 随机获取一条语录
    const randomIndex = Math.floor(Math.random() * data.quotes.length);
    const quote = data.quotes[randomIndex];
    
    return NextResponse.json({ 
      success: true, 
      data: quote 
    });
  } catch (error) {
    console.error('获取随机语录失败:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: '获取随机语录失败' 
    }, { status: 500 });
  }
} 