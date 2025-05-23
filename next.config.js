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
    unoptimized: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;