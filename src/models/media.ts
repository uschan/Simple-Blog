import mongoose, { Schema, model, models } from 'mongoose';

// 媒体文件接口定义
export interface IMedia extends Document {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: mongoose.Types.ObjectId;
  width?: number;
  height?: number;
  alt?: string;
  usage?: string; // 媒体用途
  createdAt: Date;
  updatedAt: Date;
}

// 媒体文件模式定义
const MediaSchema = new Schema({
  type: {
    type: String,
    enum: ['image', 'video', 'document'],
    required: true,
    default: 'image'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: function(this: any) {
      // 默认使用原图url作为缩略图
      return this.url;
    }
  },
  size: {
    type: Number, // 以字节为单位
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  width: {
    type: Number,
    default: 0
  },
  height: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String,
    required: true
  },
  usage: {
    type: String,
    enum: ['media', 'category', 'article', 'avatar', 'logo', 'favicon'],
    default: 'media'
  }
}, {
  timestamps: true // 添加 createdAt 和 updatedAt 字段
});

// 索引以加快查询速度
MediaSchema.index({ name: 1 });
MediaSchema.index({ type: 1 });
MediaSchema.index({ createdAt: -1 });
MediaSchema.index({ usage: 1 }); // 添加用途索引

// 创建或获取媒体模型
export const Media = models.Media || model('Media', MediaSchema);

export default Media; 