import mongoose, { Schema, Document } from 'mongoose';

// 文章接口定义
export interface IArticle extends Document {
  title: string;
  content: string;
  summary: string;
  slug: string;
  coverImage?: string;
  coverType?: 'image' | 'gallery' | 'video';
  coverGallery?: string[];
  coverVideo?: string;
  displayOption?: string;
  categories: mongoose.Types.ObjectId[];
  tags: string[];
  author?: mongoose.Types.ObjectId;
  authorName?: string;
  status: 'draft' | 'published'; 
  views: number;
  likes: number;
  comments: number;
  isFeatured?: boolean;
  isSlider?: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

// 文章模式定义
const ArticleSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    summary: { type: String, required: true },
    slug: { type: String, required: true, unique: true, trim: true },
    coverImage: { type: String },
    coverType: { type: String, enum: ['image', 'gallery', 'video'] },
    coverGallery: [{ type: String }],
    coverVideo: { type: String },
    displayOption: { type: String },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    tags: [{ type: String }],
    author: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    authorName: { type: String },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isSlider: { type: Boolean, default: false },
    publishedAt: { type: Date }
  },
  { timestamps: true }
);

// 索引
// 修改全文搜索索引，添加权重配置，title权重最高，其次是summary和content
ArticleSchema.index({ 
  title: 'text', 
  content: 'text', 
  summary: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,    // 标题权重最高
    summary: 5,   // 摘要权重其次
    tags: 3,      // 标签权重第三
    content: 1    // 内容权重最低
  },
  name: "ArticleTextIndex",
  default_language: "none"  // 避免使用特定语言的分词器，更好地支持中文
});
ArticleSchema.index({ createdAt: -1 });
ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ categories: 1 });
ArticleSchema.index({ tags: 1 });
ArticleSchema.index({ isFeatured: 1 });
ArticleSchema.index({ isSlider: 1 });

// 避免在测试环境中多次编译模型
const Article = mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);

export default Article; 