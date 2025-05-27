import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    // 从请求中获取数据
    const data = await req.json();
    
    // 简单验证
    if (!data.quotes || !Array.isArray(data.quotes)) {
      return NextResponse.json({ 
        success: false, 
        error: 'JSON必须包含quotes数组' 
      }, { status: 400 });
    }
    
    // 验证每条语录格式
    for (const quote of data.quotes) {
      if (!quote.id || !quote.text || !quote.author) {
        return NextResponse.json({ 
          success: false, 
          error: '每条语录必须包含id、text和author字段' 
        }, { status: 400 });
      }
    }
    
    // 保存JSON文件
    const jsonPath = path.join(process.cwd(), 'src/data/shareQuotes.json');
    
    // 添加最后更新时间
    const dataToSave = {
      ...data,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    await fs.writeFile(jsonPath, JSON.stringify(dataToSave, null, 2), 'utf8');
    
    return NextResponse.json({ 
      success: true, 
      message: '语录数据已更新' 
    });
  } catch (error) {
    console.error('更新语录数据失败:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: '更新语录数据失败' 
    }, { status: 500 });
  }
} 