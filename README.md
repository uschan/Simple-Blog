# 野盐博客系统 (Wild Salt Blog)

一个基于 Next.js 15 构建的现代化博客系统，集成 AI 辅助创作功能，支持文章管理、媒体库、评论系统等完整功能。

## 📋 项目概述

野盐博客是一个全栈博客系统，采用 Next.js App Router 架构，提供前台展示和后台管理功能。系统集成了 DeepSeek AI 辅助创作，支持多种内容格式（文章、图片、视频、图集），具备完整的用户认证、评论互动、数据分析等功能。

### 核心特性

- 🤖 **AI 驱动创作**：集成 DeepSeek API，提供智能标题生成、内容分析、SEO 优化等功能
- 📝 **富文本编辑**：支持 EditorJS 和 TipTap 双编辑器
- 🎨 **现代化 UI**：基于 Tailwind CSS，支持暗色模式
- 📊 **数据分析**：文章浏览量统计、用户行为分析
- 💬 **评论系统**：支持评论、表情反应（Emoji Reactions）
- 🖼️ **媒体管理**：完整的媒体库管理，支持图片、视频、图集
- 🔐 **权限管理**：基于 JWT 的认证系统，支持角色权限控制
- 📱 **响应式设计**：完美适配桌面端和移动端

## 🛠️ 技术栈

### 前端技术

- **框架**: Next.js 15.3.2 (App Router)
- **语言**: TypeScript 5
- **UI 框架**: React 18
- **样式方案**: Tailwind CSS 3.3.0
- **状态管理**: SWR 2.2.4 + React Context API
- **表单处理**: React Hook Form 7.49.3 + Zod 3.22.4
- **动画库**: Framer Motion 10.18.0
- **通知提示**: React Hot Toast 2.5.2

### 后端技术

- **运行时**: Node.js (推荐 18+)
- **数据库**: MongoDB 6.3.0 + Mongoose 8.14.3
- **认证**: JWT (jsonwebtoken 9.0.2) + NextAuth 4.24.5
- **HTTP 客户端**: Axios 1.9.0

### 编辑器

- **EditorJS**: 2.30.8 (块编辑器)
- **TipTap**: 2.12.0 (所见即所得编辑器)

### AI 集成

- **AI 服务**: DeepSeek API
- **功能**: 文章分析、标题生成、内容润色、SEO 优化

### 部署工具

- **进程管理**: PM2
- **构建模式**: Next.js Standalone

## 📁 项目结构

```
blog/
├── public/                    # 静态资源
│   ├── components/           # 公共组件
│   ├── css/                  # 公共样式
│   ├── images/               # 图片资源
│   ├── js/                   # 公共脚本
│   └── uploads/              # 上传文件目录
├── scripts/                  # 工具脚本
│   ├── check-merge-conflicts.js  # 检查合并冲突
│   ├── create-admin.js       # 创建管理员账户
│   ├── fix-standalone-api.js # 修复 standalone 模式 API 路由
│   ├── init-data.js          # 初始化数据
│   └── setup-mongodb.js      # MongoDB 设置
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── admin/            # 后台管理路由
│   │   │   ├── analytics/    # 数据分析
│   │   │   ├── apikeys/      # API 密钥管理
│   │   │   ├── articles/     # 文章管理
│   │   │   ├── categories/   # 分类管理
│   │   │   ├── comments/     # 评论管理
│   │   │   ├── media/        # 媒体库
│   │   │   ├── settings/     # 系统设置
│   │   │   └── ...
│   │   ├── api/              # API 路由
│   │   │   ├── admin/        # 管理后台 API
│   │   │   ├── articles/     # 文章相关 API
│   │   │   ├── categories/   # 分类相关 API
│   │   │   ├── comments/     # 评论相关 API
│   │   │   └── ...
│   │   ├── article/          # 文章详情页
│   │   ├── category/         # 分类页面
│   │   └── page.tsx          # 首页
│   ├── components/           # React 组件
│   │   ├── admin/            # 后台组件
│   │   ├── blog/             # 前台组件
│   │   └── shared/           # 共享组件
│   ├── lib/                  # 工具库
│   │   ├── aiService.ts      # AI 服务
│   │   ├── api.ts            # API 工具
│   │   ├── auth.ts           # 认证工具
│   │   ├── db.ts             # 数据库连接
│   │   └── ...
│   ├── models/               # Mongoose 数据模型
│   │   ├── article.ts        # 文章模型
│   │   ├── category.ts       # 分类模型
│   │   ├── comment.ts        # 评论模型
│   │   ├── user.ts           # 用户模型
│   │   └── ...
│   ├── middleware.ts         # Next.js 中间件
│   └── styles/               # 样式文件
├── .env                      # 环境变量（需自行创建）
├── ecosystem.config.js       # PM2 配置文件
├── next.config.js            # Next.js 配置
├── package.json              # 项目依赖
├── tailwind.config.ts        # Tailwind CSS 配置
└── tsconfig.json             # TypeScript 配置
```

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- MongoDB 6.0+
- npm 或 yarn

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd blog
```

2. **安装依赖**

```bash
npm install
# 或
yarn install
```

3. **配置环境变量**

复制 `env.example` 文件为 `.env`，并填写相应配置：

```bash
cp env.example .env
```

编辑 `.env` 文件：

```env
# 数据库连接信息
MONGODB_URI=mongodb://localhost:27017/your_blog_db

# 认证相关
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_key_here

# API URL配置
NEXT_PUBLIC_API_URL=http://localhost:3000

# 上传文件配置
# Windows 开发环境
UPLOAD_BASE_PATH=D:/blog_uploads
# Linux 生产环境
# UPLOAD_BASE_PATH=/var/www/blog_uploads

# 上传文件访问URL前缀
NEXT_PUBLIC_UPLOAD_URL=/uploads
```

4. **初始化数据库**

```bash
# 创建管理员账户
node scripts/create-admin.js

# 初始化基础数据（可选）
node scripts/init-data.js
```

5. **启动开发服务器**

```bash
npm run dev
```

访问 http://localhost:3000 查看前台，http://localhost:3000/admin/login 访问后台。

## 📦 构建与部署

### 开发环境

```bash
npm run dev
```

### 生产构建

```bash
# 构建项目（包含冲突检查和 API 修复）
npm run build

# 启动生产服务器
npm start
```

### 使用 PM2 部署

1. **构建项目**

```bash
npm run build
```

2. **配置 PM2**

编辑 `ecosystem.config.js`，设置正确的环境变量：

```javascript
env_production: {
  NODE_ENV: 'production',
  PORT: 3000,
  NEXTAUTH_SECRET: 'your_secret',
  NEXTAUTH_URL: 'https://your-domain.com',
  JWT_SECRET: 'your_jwt_secret',
  MONGODB_URI: 'your_mongodb_uri',
  // ... 其他环境变量
}
```

3. **启动应用**

```bash
# 使用 PM2 启动
pm2 start ecosystem.config.js --env production

# 查看状态
pm2 status

# 查看日志
pm2 logs my-blog-app

# 重启应用
pm2 restart my-blog-app

# 停止应用
pm2 stop my-blog-app
```

### 部署注意事项

1. **文件上传目录**

确保上传目录有写入权限：

```bash
# Linux
mkdir -p /var/www/blog_uploads
chmod 755 /var/www/blog_uploads

# Windows
# 确保 D:/blog_uploads 目录存在且有写入权限
```

2. **MongoDB 连接**

- 生产环境建议使用 MongoDB Atlas 或配置认证
- 确保 MongoDB 服务正常运行
- 检查防火墙设置，允许应用访问 MongoDB

3. **环境变量**

- 生产环境务必使用强密码和密钥
- 不要将 `.env` 文件提交到版本控制
- 使用环境变量管理工具（如 PM2 的 env 配置）

4. **Next.js Standalone 模式**

项目已配置为 standalone 模式，构建后的文件位于 `.next/standalone/` 目录。确保：

- `public` 目录被正确复制到 standalone 目录
- `.next/static` 目录可访问
- 上传目录路径正确配置

5. **Nginx 反向代理（可选）**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 主要功能说明

### 前台功能

- **首页**: 文章列表展示，支持分页、筛选
- **文章详情**: 文章内容展示，支持评论、表情反应
- **分类浏览**: 按分类查看文章
- **搜索功能**: 全文搜索文章
- **响应式设计**: 适配各种设备

### 后台管理

- **文章管理**: 创建、编辑、删除文章，支持草稿和发布
- **媒体库**: 上传、管理图片、视频，支持批量操作
- **分类管理**: 创建和管理文章分类
- **评论管理**: 审核、回复、删除评论
- **AI 助手**: 
  - 一键分析文章标题和内容
  - 生成 SEO 友好的 URL slug
  - 提取标签关键词
  - 内容润色和优化
  - 标题生成建议
- **数据分析**: 文章浏览量统计、用户行为分析
- **系统设置**: 网站配置、API 密钥管理
- **API 密钥管理**: 配置 DeepSeek 等 AI 服务的 API 密钥

## 🔐 认证与权限

系统使用 JWT 进行认证，支持以下角色：

- **admin**: 管理员，拥有所有权限
- **editor**: 编辑，可以管理文章和评论
- **author**: 作者，可以创建和管理自己的文章
- **subscriber**: 订阅者，只能查看内容

### 创建管理员账户

```bash
node scripts/create-admin.js
```

按提示输入用户名、邮箱和密码即可创建管理员账户。

## 🤖 AI 功能配置

### 配置 DeepSeek API

1. 访问后台管理页面：`/admin/apikeys`
2. 添加新的 API 密钥，选择服务类型为 `deepseek`
3. 输入 API Key 和名称
4. （可选）配置 Prompt 模板，用于自定义 AI 分析行为

### AI 功能说明

- **文章分析**: 分析标题和内容，生成 URL slug、标签、摘要等
- **内容润色**: 优化文章表达，提升语言质量
- **标题生成**: 根据内容生成多个标题选项
- **SEO 优化**: 生成 SEO 友好的 URL 和关键词建议

## 📝 开发规范

### 代码风格

- 使用 TypeScript 严格模式
- 组件使用函数式组件和 Hooks
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码

### 命名规范

- **文件名**: 
  - 组件使用 PascalCase: `ArticleCard.tsx`
  - 工具函数使用 camelCase: `apiUtils.ts`
- **变量名**: camelCase
- **常量**: UPPER_SNAKE_CASE
- **类型和接口**: PascalCase

### Git 提交规范

使用 Conventional Commits：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码风格更改
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 🐛 常见问题

### 1. MongoDB 连接失败

- 检查 MongoDB 服务是否运行
- 确认 `MONGODB_URI` 环境变量正确
- 检查防火墙和网络设置

### 2. 文件上传失败

- 确认 `UPLOAD_BASE_PATH` 目录存在
- 检查目录写入权限
- 确认 `NEXT_PUBLIC_UPLOAD_URL` 配置正确

### 3. AI 功能无法使用

- 检查 API 密钥是否配置
- 确认网络连接正常
- 查看浏览器控制台和服务器日志

### 4. 构建失败

- 运行 `npm run check-conflicts` 检查合并冲突
- 检查 TypeScript 类型错误
- 确认所有依赖已正确安装

### 5. PM2 启动失败

- 确认已运行 `npm run build`
- 检查 `.next/standalone/server.js` 是否存在
- 查看 PM2 日志: `pm2 logs my-blog-app`

## 📚 相关文档

- [Next.js 文档](https://nextjs.org/docs)
- [Mongoose 文档](https://mongoosejs.com/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs)

## 📄 许可证

本项目为私有项目，未经授权不得使用。

## 👥 贡献

如有问题或建议，请提交 Issue 或 Pull Request。

## 📞 联系方式

如有任何问题，请联系项目维护者。

---

**最后更新**: 2024年
