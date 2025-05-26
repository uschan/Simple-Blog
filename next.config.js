/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    // 修正拼写错误（原配置有拼写问题）
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];

const nextConfig = {
  // 添加 headers 配置函数
  async headers() {
    return [
      {
        source: '/(.*)', // 应用到所有路由
        headers: securityHeaders,
      },
    ];
  },

  // 外部包配置（已从experimental移出）
  serverExternalPackages: ['mongoose'],
  output: 'standalone',
  
  // 文件追踪排除配置（已从experimental移出）
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/darwin-x64',
    ],
  },
  
  // 实验性功能
  experimental: {
    // 启用服务器动作参考追踪，确保API路由被包含
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ai.wildsalt.me',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
    unoptimized: false,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;