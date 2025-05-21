// 创建管理员账户脚本
// 使用方法: node scripts/create-admin.js

const mongoose = require('mongoose');
const crypto = require('crypto');

// MongoDB连接URI
const MONGODB_URI = 'mongodb://localhost:27017/blog';

// 数据库连接选项 - 移除认证信息
const options = {
  autoIndex: true, // 自动创建索引
};

// 带认证的连接选项
const authOptions = {
  user: 'admin',
  pass: 'jimeng@0301$',
  autoIndex: true, // 自动创建索引
};

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

// MongoDB创建用户函数
async function createMongoDBUser() {
  try {
    console.log('尝试创建MongoDB用户...');
    const adminDB = mongoose.connection.db.admin();
    
    try {
      // 首先尝试创建blog数据库
      await mongoose.connection.db.createCollection('test_collection');
      console.log('成功创建测试集合');
      
      // 创建用户
      await adminDB.command({
        createUser: 'admin',
        pwd: 'jimeng@0301$',
        roles: [
          { role: 'readWrite', db: 'blog' },
          { role: 'dbAdmin', db: 'blog' }
        ]
      });
      
      console.log('MongoDB用户创建成功！');
    } catch (err) {
      console.log('用户可能已存在或没有权限创建用户:', err.message);
    }
  } catch (err) {
    console.error('创建MongoDB用户时出错:', err);
  }
}

// 初始化模型
mongoose.model('User', UserSchema);

// 连接数据库并创建管理员账户
async function main() {
  try {
    console.log('正在尝试不带认证连接MongoDB...');
    await mongoose.connect(MONGODB_URI, options);
    console.log('连接成功！');
    
    // 尝试创建MongoDB用户
    await createMongoDBUser();
    
    // 关闭不带认证的连接
    await mongoose.disconnect();
    console.log('已断开无认证连接');
    
    // 重新连接，带认证
    console.log('正在尝试带认证连接MongoDB...');
    try {
      await mongoose.connect(MONGODB_URI, authOptions);
      console.log('认证连接成功！');
      
      const UserModel = mongoose.model('User');
      
      // 检查管理员是否已存在
      const adminExists = await UserModel.findOne({ username: 'admin' });
      
      if (adminExists) {
        console.log('管理员账户已存在，用户名: admin');
        console.log('如果需要重置密码，请直接修改数据库或使用管理后台');
      } else {
        // 创建新管理员
        const admin = new UserModel({
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          nickname: '管理员',
          status: 'active'
        });
        
        // 设置密码
        admin.setPassword('jimeng@0301$');
        await admin.save();
        
        console.log('管理员账户创建成功！');
        console.log('用户名: admin');
        console.log('密码: jimeng@0301$');
      }
    } catch (authErr) {
      console.error('认证连接失败:', authErr.message);
      console.log('请确保MongoDB已安装并运行，并有权限创建用户');
    }
  } catch (error) {
    console.error('创建管理员账户时出错:', error);
  } finally {
    // 关闭数据库连接
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('已断开数据库连接');
    }
  }
}

// 执行主函数
main(); 