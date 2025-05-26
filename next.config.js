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

  serverExternalPackages: ['mongoose'],
  output: 'standalone',
  
  // 确保API路由被正确包含在standalone输出中
  experimental: {
    // 必要的实验性配置，以确保API路由被正确构建
    serverComponentsExternalPackages: ['mongoose'],
    
    // 排除一些不必要的构建文件
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@esbuild/darwin-x64',
      ],
    },
    
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