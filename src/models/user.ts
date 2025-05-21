import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

// 社交媒体接口
interface ISocialMedia {
  name: string;
  url: string;
  icon: string;
}

// 用户接口定义
export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  socials?: ISocialMedia[];
  role: 'admin' | 'editor' | 'author' | 'subscriber';
  status: 'active' | 'inactive' | 'banned';
  lastLogin?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  validatePassword: (password: string) => boolean;
  setPassword: (password: string) => void;
}

// 社交媒体模式
const SocialMediaSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  icon: { type: String, required: true }
}, { _id: false });

// 用户模式定义
const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    nickname: { type: String, trim: true },
    avatar: { type: String },
    bio: { type: String },
    socials: [SocialMediaSchema],
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

// 索引
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });

// 密码验证方法
UserSchema.methods.validatePassword = function(password: string): boolean {
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
    .toString('hex');
  return this.passwordHash === hash;
};

// 设置密码方法
UserSchema.methods.setPassword = function(password: string): void {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.passwordHash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
    .toString('hex');
};

// 避免在测试环境中多次编译模型
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User; 