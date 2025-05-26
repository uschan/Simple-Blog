import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt'

// 使用默认运行时环境，避免与edge runtime冲突
// 默认的运行时环境在服务器上应该是nodejs

export async function middleware(request: NextRequest) {
  // 获取路径和请求方法
  const path = request.nextUrl.pathname;
  const method = request.method;

  console.log(`[Middleware] 处理请求: ${method} ${path}`);
  
  // 如果是登录API，直接放行
  if (path === '/api/admin/auth') {
    console.log(`[Middleware] 允许访问认证API: ${path}`);
    return NextResponse.next();
  }
  
  // 如果不是管理员API路径，直接放行
  if (!path.startsWith('/api/admin')) {
    return NextResponse.next();
  }
  
  // 允许更新管理员API无需认证
  if (path.endsWith('/updateAdmin')) {
    console.log(`[Middleware] 允许访问更新管理员API: ${path}`);
    return NextResponse.next();
  }
  
  // 获取并验证令牌
    const authHeader = request.headers.get('authorization');
  console.log(`[Middleware Debug] 认证头: ${authHeader?.substring(0, 20)}...`);
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    console.log(`[Middleware] 拒绝访问: 缺少认证令牌 ${path}`);
      return new NextResponse(
        JSON.stringify({ message: '未授权访问，缺少认证令牌' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    
  try {
    // 验证令牌 (异步)
    const decoded = await verifyToken(token);
    
    console.log(`[Middleware] 令牌解码结果:`, JSON.stringify(decoded));
    
    if (!decoded) {
      console.log(`[Middleware] 拒绝访问: 无效令牌 ${path}`);
      return new NextResponse(
        JSON.stringify({ message: '无效或过期的认证令牌' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    
    // 验证是否为管理员 - 注意这里，令牌的role字段位置可能不同
    if (!decoded.role && !decoded.userId) {
      console.log(`[Middleware] 拒绝访问: 无效的令牌格式 ${path}`);
      return new NextResponse(
        JSON.stringify({ message: '无效的令牌格式' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    
    // 检查角色
    if (decoded.role !== 'admin') {
      console.log(`[Middleware] 拒绝访问: 非管理员角色 ${path}, 角色=${decoded.role}`);
      return new NextResponse(
        JSON.stringify({ message: '权限不足，需要管理员权限' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }

    console.log(`[Middleware] 允许管理员访问: ${path}, 用户: ${decoded.username}`);
  return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] 令牌验证错误:', error);
    return new NextResponse(
      JSON.stringify({ message: '认证失败' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }
}

// 配置匹配路径 - 仅匹配管理员API路径
export const config = {
  matcher: [
    // 管理员API路由
    '/api/admin/:path*'
  ]
}; 