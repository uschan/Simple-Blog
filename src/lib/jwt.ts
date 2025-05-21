/**
 * JWT工具 - 统一管理JWT密钥和验证逻辑 (Edge Runtime兼容版)
 */

import * as jose from 'jose';

// JWT密钥 - 开发环境允许默认值，生产环境严格要求环境变量
const JWT_SECRET_KEY = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' 
  ? undefined
  : 'wildsalt_secure_jwt_key_2024_dev_only');

// 创建签名密钥
const getSigningKey = () => {
  if (!JWT_SECRET_KEY) {
    console.error('错误: JWT_SECRET未设置');
    return null;
  }
  return new TextEncoder().encode(JWT_SECRET_KEY);
};

// 日志密钥信息
if (!process.env.JWT_SECRET) {
  console.warn('警告: 环境变量JWT_SECRET未设置，' + 
    (process.env.NODE_ENV === 'production' 
      ? '这在生产环境中是不安全的！' 
      : '在开发环境中使用默认值，生产环境请务必设置此变量'));
}

// JWT配置
export const JWT_SECRET = JWT_SECRET_KEY;
const JWT_EXPIRES = '24h';

/**
 * 生成JWT令牌
 * @param payload 令牌中的数据
 * @returns 签名后的令牌
 */
export async function generateToken(payload: any): Promise<string | null> {
  try {
    const secretKey = getSigningKey();
    if (!secretKey) return null;
    
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES)
      .sign(secretKey);
    
    return token;
  } catch (error) {
    console.error('生成令牌失败:', error);
    return null;
  }
}

/**
 * 验证JWT令牌
 * @param token 要验证的令牌
 * @returns 解码后的内容，验证失败返回null
 */
export async function verifyToken(token: string): Promise<any | null> {
  try {
    const secretKey = getSigningKey();
    if (!secretKey) return null;
    
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    console.error('令牌验证失败:', error);
    return null;
  }
}

/**
 * 从认证头中提取令牌
 * @param authHeader 认证头
 * @returns 令牌字符串，没有找到则返回null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
} 