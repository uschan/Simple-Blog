import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// 认证配置
export const authOptions: NextAuthOptions = {
  // 会话策略
  session: {
    strategy: 'jwt',
  },
  // 页面配置
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  // 认证提供者：这里需要根据实际情况配置
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        // 开发环境下的简单验证逻辑
        if (credentials?.username === 'admin' && credentials?.password === 'password') {
          return {
            id: '1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
          }
        }
        return null;
      }
    }),
  ],
  // 回调
  callbacks: {
    // 在会话中添加用户角色
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        // 如果token中有角色信息，添加到会话中
        if (token.role) {
          session.user.role = token.role as string;
        }
      }
      return session;
    },
    // JWT回调
    async jwt({ token, user }) {
      // 首次登录时，将用户数据合并到token
      if (user) {
        token.role = (user as any).role || 'user';
      }
      return token;
    }
  }
};

// 类型声明扩展
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    }
  }
} 