# 博客应用

这是一个基于Next.js的博客应用程序，带有完整的前后台功能。

## 环境变量设置

**重要：** 此应用程序需要正确设置环境变量才能安全运行，特别是在生产环境中。

创建一个名为`.env.local`的文件在项目根目录，并设置以下变量：

```
# JWT安全密钥 - 生产环境必须使用强随机字符串
JWT_SECRET=your_secure_random_string_min_32_chars

# 数据库连接 (如果使用外部数据库)
# MONGODB_URI=mongodb://username:password@host:port/database

# 其他配置
# NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### JWT密钥生成

为了生成安全的JWT密钥，可以使用以下命令：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 开发

```bash
npm install
npm run dev
```

## 构建和部署

```bash
npm run build
npm start
```

确保在部署到生产环境之前正确设置了所有必要的环境变量。 