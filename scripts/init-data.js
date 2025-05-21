// 初始化数据脚本
// 使用方法: node scripts/init-data.js

const mongoose = require('mongoose');
const crypto = require('crypto');

// MongoDB连接URI
const MONGODB_URI = 'mongodb://localhost:27017/blog';

// 用户Schema定义
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    nickname: { type: String, trim: true },
    avatar: { type: String },
    bio: { type: String },
    role: {
      type: String,
      enum: ['admin', 'editor', 'author', 'subscriber'],
      default: 'subscriber'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active'
    },
    lastLogin: { type: Date },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date }
  },
  { timestamps: true }
);

// 分类Schema定义
const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    order: { type: Number, default: 0 },
    count: { type: Number, default: 0 } // 文章数量
  },
  { timestamps: true }
);

// 设置Schema定义
const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: String, required: true },
    group: { type: String, trim: true, default: 'general' }
  },
  { timestamps: true }
);

// 密码验证方法
UserSchema.methods.validatePassword = function(password) {
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
    .toString('hex');
  return this.passwordHash === hash;
};

// 设置密码方法
UserSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.passwordHash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
    .toString('hex');
};

// 注册模型
const User = mongoose.model('User', UserSchema);
const Category = mongoose.model('Category', CategorySchema);
const Setting = mongoose.model('Setting', SettingSchema);

// 默认设置数据
const defaultSettings = [
  { key: 'siteTitle', value: '我的博客', group: 'general' },
  { key: 'siteDescription', value: '个人博客系统', group: 'general' },
  { key: 'siteKeywords', value: '博客,技术,分享', group: 'general' },
  { key: 'siteFooter', value: '© 2023 My Blog. All rights reserved.', group: 'general' },
  { key: 'commentEnabled', value: 'true', group: 'comment' },
  { key: 'registrationEnabled', value: 'false', group: 'user' },
  { key: 'theme', value: 'light', group: 'appearance' }
];

// 默认分类数据
const defaultCategories = [
  { name: '技术', slug: 'tech', description: '技术相关文章', order: 1 },
  { name: '生活', slug: 'life', description: '生活点滴', order: 2 },
  { name: '随笔', slug: 'essay', description: '随笔记录', order: 3 }
];

// 初始化数据库
async function initializeData() {
  try {
    console.log('正在连接MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('连接成功！');

    // 创建管理员用户
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      console.log('创建管理员用户...');
      const admin = new User({
        username: 'admin',
        email: 'admin@example.com',
        nickname: '管理员',
        role: 'admin',
        status: 'active'
      });
      admin.setPassword('jimeng@0301$');
      await admin.save();
      console.log('管理员用户创建成功！');
    } else {
      console.log('管理员用户已存在，跳过创建');
    }

    // 创建默认分类
    for (const category of defaultCategories) {
      const existingCategory = await Category.findOne({ slug: category.slug });
      if (!existingCategory) {
        console.log(`创建分类: ${category.name}`);
        await Category.create(category);
      } else {
        console.log(`分类 ${category.name} 已存在，跳过创建`);
      }
    }

    // 创建默认设置
    for (const setting of defaultSettings) {
      const existingSetting = await Setting.findOne({ key: setting.key });
      if (!existingSetting) {
        console.log(`创建设置: ${setting.key}`);
        await Setting.create(setting);
      } else {
        console.log(`设置 ${setting.key} 已存在，跳过创建`);
      }
    }

    console.log('数据初始化完成！');
  } catch (error) {
    console.error('初始化数据时出错:', error);
  } finally {
    await mongoose.disconnect();
    console.log('已断开数据库连接');
  }
}

// 执行初始化
initializeData(); 