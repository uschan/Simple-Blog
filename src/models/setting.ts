import mongoose, { Schema, Document } from 'mongoose';

// 系统设置接口定义
export interface ISetting extends Document {
  key: string;
  value: string;
  group?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 系统设置模式定义
const SettingSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: String, required: true },
    group: { type: String, trim: true, default: 'general' }
  },
  { timestamps: true }
);

// 索引
// SettingSchema.index({ key: 1 }, { unique: true }); // 移除重复索引，因为已在字段定义中使用了unique: true
SettingSchema.index({ group: 1 });

// 避免在测试环境中多次编译模型
const Setting = mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);

export default Setting; 