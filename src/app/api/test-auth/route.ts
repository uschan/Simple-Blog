export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  // 获取认证头
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ 
      message: '没有提供令牌',
      success: false
    });
  }
  
  // 提取令牌
  const token = authHeader.substring(7);
  
  try {
    // 解码令牌
    const decoded = await verifyToken(token);
    
    // 返回令牌信息
    return NextResponse.json({
      message: '令牌解码成功',
      success: true,
      decoded: decoded,
      tokenInfo: {
        hasRole: !!decoded?.role,
        role: decoded?.role,
        hasUserId: !!decoded?.userId,
        userId: decoded?.userId,
        username: decoded?.username
      }
    });
  } catch (error) {
    return NextResponse.json({
      message: '令牌解码失败',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 400 });
  }
} 