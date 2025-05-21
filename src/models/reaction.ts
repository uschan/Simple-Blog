import mongoose, { Schema, Document } from 'mongoose';

// 反应接口定义
export interface IReaction extends Document {
  articleId: mongoose.Types.ObjectId;
  emoji: string;
  userId?: string;
  userIp?: string;
  sessionId?: string; // 会话唯一标识符
  createdAt: Date;
  updatedAt: Date;
}

// 反应模式定义
const ReactionSchema: Schema = new Schema(
  {
    articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
    emoji: { type: String, required: true, enum: ['like', 'haha', 'love', 'sad', 'angry'] },
    userId: { type: String }, // 可以是匿名用户
    userIp: { type: String }, // 记录IP以便分析
    sessionId: { type: String }, // 用于区分不同会话的点击
  },
  { timestamps: true }
);

// 索引
ReactionSchema.index({ articleId: 1 });
ReactionSchema.index({ emoji: 1 });
// 注释：我们不创建sessionId的索引，因为它只用于绕过唯一约束

// MongoDB内部可能会创建复合索引，为了故障排除，记录一下
// 如果遇到E11000错误(唯一索引冲突)，可能需要在MongoDB中手动删除该索引
// 命令: db.reactions.dropIndex("articleId_1_userId_1")

// 避免在测试环境中多次编译模型
const Reaction = mongoose.models.Reaction || mongoose.model<IReaction>('Reaction', ReactionSchema);

export default Reaction; 