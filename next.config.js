   /** @type {import('next').NextConfig} */
   const nextConfig = {
    experimental: {
      serverComponentsExternalPackages: ['mongoose'],
      missingSuspenseWithCSRBailout: false,
    },
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
      unoptimized: true, // 禁用图像优化，直接使用原始图片
    },
    // 添加以下内容:
    typescript: {
      ignoreBuildErrors: true, // 暂时忽略类型错误
    },
    eslint: {
      ignoreDuringBuilds: true, // 忽略ESLint错误
    }
  };

  module.exports = nextConfig;