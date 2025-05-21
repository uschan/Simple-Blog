export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models';

/**
 * 更新管理员账户信息 - 仅限已认证的管理员使用
 * 需要在请求体中提供:
 * {
 *   "newUsername": "用户名",
 *   "newEmail": "邮箱",
 *   "newPassword": "密码"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 验证调用者是否为管理员
    let userId = null;
    let userRole = null;
    
    // 从请求头获取认证令牌
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        message: '未授权访问',
        success: false
      }, { status: 401 });
    }
    
    // 验证令牌
    try {
      const token = authHeader.substring(7);
      // 导入并使用JWT验证
      const { verifyToken } = await import('@/lib/jwt');
      const decoded = await verifyToken(token);
      
      if (!decoded || !decoded.userId) {
        throw new Error('无效令牌');
      }
      
      userId = decoded.userId;
      userRole = decoded.role;
      
      // 检查是否为管理员
      if (userRole !== 'admin') {
        return NextResponse.json({ 
          message: '需要管理员权限',
          success: false
        }, { status: 403 });
      }
    } catch (tokenError) {
      console.error('令牌验证失败:', tokenError);
      return NextResponse.json(
        { success: false, message: '未授权访问，令牌无效' },
        { status: 401 }
      );
    }

    // 获取请求体
    const body = await request.json();
    const { newUsername, newEmail, newPassword } = body;

    // 验证必要参数
    if (!newUsername || !newEmail || !newPassword) {
      return NextResponse.json({ 
        message: '缺少必要参数',
        success: false
      }, { status: 400 });
    }

    await connectDB();
    
    // 先检查是否已存在目标用户名的用户
    const existingNewUser = await User.findOne({ username: newUsername });
    
    // 如果已存在目标用户，且不是当前用户，则返回错误
    if (existingNewUser && existingNewUser._id.toString() !== userId) {
      return NextResponse.json({ 
        message: `用户名 ${newUsername} 已被使用`,
        success: false
      }, { status: 400 });
    }
    
    // 更新当前管理员账户
    const adminUser = await User.findById(userId);
    
    if (adminUser) {
      // 更新为新的用户名和密码
      adminUser.username = newUsername;
      adminUser.email = newEmail;
      adminUser.setPassword(newPassword);
      await adminUser.save();
      
      return NextResponse.json({ 
        message: '管理员账户已更新',
        success: true
      });
    } else {
      return NextResponse.json({ 
        message: '找不到当前管理员账户',
        success: false
      }, { status: 404 });
    }
  } catch (error: any) {
    console.error('更新管理员账户失败:', error);
    return NextResponse.json(
      { message: '更新管理员账户失败', error: error.message, success: false },
      { status: 500 }
    );
  }
}