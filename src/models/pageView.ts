import mongoose, { Schema, Document } from 'mongoose';

// 页面访问接口定义
export interface IPageView extends Document {
  articleId: mongoose.Types.ObjectId;
  ip: string;
  userAgent?: string;
  referer?: string;
  country?: string;
  browserInfo?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  sessionId?: string;
  visitDuration?: number; // 访问时长（秒）
  createdAt: Date;
  updatedAt: Date;
}

// 页面访问模式定义
const PageViewSchema: Schema = new Schema(
  {
    articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
    ip: { type: String, required: true },
    userAgent: { type: String },
    referer: { type: String },
    country: { type: String },
    browserInfo: { type: String },
    deviceType: { 
      type: String, 
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    sessionId: { type: String },
    visitDuration: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// 索引
PageViewSchema.index({ articleId: 1, createdAt: -1 }); // 按文章和时间查询
PageViewSchema.index({ createdAt: 1 }); // 时间范围分析
PageViewSchema.index({ ip: 1, articleId: 1, createdAt: 1 }); // 用于防重复点击

// 避免在测试环境中多次编译模型
const PageView = mongoose.models.PageView || mongoose.model<IPageView>('PageView', PageViewSchema);

export default PageView; 