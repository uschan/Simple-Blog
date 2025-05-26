module.exports = {
  apps : [{

    name: 'my-blog-app', // 您的应用名称

    script: '.next/standalone/server.js', // 您的 Next.js 独立服务脚本

    instances: 1, // 运行的应用实例数量，通常是 1

    autorestart: true, // 应用崩溃时自动重启

    watch: false, // 不监控文件变化自动重启（生产环境通常设为 false）

    max_memory_restart: '1G', // 内存超过这个限制时重启

    env_production: { // 生产环境的环境变量

      NODE_ENV: 'production',
      PORT: 3000, // 明确设置端口

      NEXTAUTH_SECRET: '5N7H.%dx57{JWA:2PH)@', // 明确设置 NEXTAUTH_SECRET
      NEXTAUTH_URL: 'https://ai.wildsalt.me',
      JWT_SECRET: '5N7H.%dx57{JWA:2PH)@', // 添加 JWT_SECRET 环境变量
      
      // 其他您需要在生产环境使用的环境变量也可以加在这里

      // 例如: MONGODB_URI: '您的MongoDB连接字符串',

    }
  }],
};
