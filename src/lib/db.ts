import mongoose from 'mongoose';

// MongoDB连接URI，添加认证信息到URI中
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:jimeng%400301%24@localhost:27017/blog?authSource=admin';

// 数据库连接选项
const options: mongoose.ConnectOptions = {
  autoIndex: true, // 自动创建索引
};

// 全局变量，避免在开发环境下重复连接
let cached: {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} = { conn: null, promise: null };

if (process.env.NODE_ENV === 'development') {
  // 在全局对象上缓存连接实例
  // @ts-ignore
  if (!global._mongooseCache) {
    // @ts-ignore
    global._mongooseCache = { conn: null, promise: null };
  }
  // @ts-ignore
  cached = global._mongooseCache;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    // console.log('正在连接MongoDB...');
    
    // 尝试先不带认证连接
    try {
      cached.promise = mongoose.connect(MONGODB_URI, options)
        .then((mongoose) => {
          // console.log('MongoDB连接成功');
          return mongoose;
        })
        .catch((err) => {
          console.error('MongoDB连接失败，尝试不带认证连接:', err);
          // 尝试不带认证连接
          return mongoose.connect('mongodb://localhost:27017/blog', options).then((mongoose) => {
            // console.log('MongoDB无认证连接成功');
            return mongoose;
          });
        });
    } catch (err) {
      console.error('MongoDB所有连接方式都失败:', err);
      throw err;
    }
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB; 