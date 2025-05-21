export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { JWT_SECRET, generateToken, verifyToken, extractTokenFromHeader } from '@/lib/jwt';

// 管理员登录验证
export async function POST(request: NextRequest) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        { message: '服务器配置错误: JWT密钥未设置' },
        { status: 500 }
      );
    }
    
    await connectDB();
    const { username, password } = await request.json();
    
    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json(
        { message: '用户名和密码不能为空' },
        { status: 400 }
      );
    }
    
    // 验证用户凭据
    const user = await User.findOne({ username, role: 'admin' });
    
    if (!user || !user.validatePassword(password)) {
      return NextResponse.json(
        { message: '用户名或密码不正确' },
        { status: 401 }
      );
    }
    
    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();
    
    // 生成JWT令牌 (异步)
    const payload = { userId: user._id, username: user.username, role: user.role };
    const token = await generateToken(payload);
    
    if (!token) {
      return NextResponse.json(
        { message: '生成令牌失败，请稍后重试' },
        { status: 500 }
      );
    }
    
    console.log(`[Auth] 生成令牌成功，用户: ${username}, 角色: ${user.role}`);
    
    return NextResponse.json({ 
      message: '登录成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          nickname: user.nickname || user.username,
          email: user.email,
          avatar: user.avatar
        }
      }
    });
  } catch (error: any) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { message: '登录失败，请稍后重试', error: error.message },
      { status: 500 }
    );
  }
}

// 验证当前登录状态
export async function GET(request: NextRequest) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        { message: '服务器配置错误: JWT密钥未设置' },
        { status: 500 }
      );
    }
    
    await connectDB();
    
    // 解析和验证JWT令牌
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      );
    }
    
    try {
      // 异步验证
      const decoded = await verifyToken(token);
      if (!decoded) {
        throw new Error('令牌验证失败');
      }
      
      const user = await User.findById(decoded.userId)
        .select('_id username email role nickname avatar')
        .lean();
      
      if (!user) {
        throw new Error('用户不存在');
      }
      
      return NextResponse.json({
        message: '验证成功',
        data: { user }
      });
    } catch (err) {
      return NextResponse.json(
        { message: '无效的令牌' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('验证登录状态失败:', error);
    return NextResponse.json(
      { message: '验证登录状态失败', error: error.message },
      { status: 500 }
    );
  }
} 