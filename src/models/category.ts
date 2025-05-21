import mongoose, { Schema, Document } from 'mongoose';

// 分类接口定义
export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  order: number;
  count: number; // 文章数量
  image?: string; // 分类图片
  isFeatured?: boolean; // 推荐分类
  createdAt: Date;
  updatedAt: Date;
}

// 分类模式定义
const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    order: { type: Number, default: 0 },
    count: { type: Number, default: 0 }, // 文章数量
    image: { type: String, trim: true }, // 分类图片
    isFeatured: { type: Boolean, default: false } // 推荐分类
  },
  { timestamps: true }
);

// 索引
// CategorySchema.index({ slug: 1 }, { unique: true }); // 移除重复索引，因为已在字段定义中使用了unique: true
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ order: 1 });
CategorySchema.index({ isFeatured: 1 }); // 添加推荐字段索引

// 避免在测试环境中多次编译模型
const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category; 