/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ 使用新的字段名
  serverExternalPackages: ['mongoose'],

  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ai.wildsalt.me',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      }
    ],
    unoptimized: true, // 禁用图像优化
  },

  // ✅ 忽略构建时的类型和 ESLint 错误（开发阶段可保留）
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
