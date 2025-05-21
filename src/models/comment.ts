import mongoose, { Schema, Document } from 'mongoose';

// 评论接口定义
export interface IComment extends Document {
  content: string;
  articleId: mongoose.Types.ObjectId;
  author: {
    name: string;
    email: string;
    website?: string;
    avatar?: string;
  };
  parentId?: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  ip?: string;
  userAgent?: string;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

// 评论模式定义
const CommentSchema: Schema = new Schema(
  {
    content: { type: String, required: true },
    articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
    author: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      website: { type: String, trim: true },
      avatar: { type: String }
    },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    ip: { type: String },
    userAgent: { type: String },
    likes: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// 索引
CommentSchema.index({ articleId: 1, createdAt: -1 });
CommentSchema.index({ status: 1 });
CommentSchema.index({ parentId: 1 });

// 避免在测试环境中多次编译模型
const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment; 