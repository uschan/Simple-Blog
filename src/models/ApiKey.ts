import mongoose, { Schema, Document } from 'mongoose';

// API密钥接口定义
export interface IApiKey extends Document {
  service: string;       // 服务标识，如 'deepseek', 'openai' 等
  name: string;          // 服务名称，如 'DeepSeek AI', 'OpenAI' 等
  apiKey: string;        // API密钥
  enabled: boolean;      // 是否启用
  description?: string;  // 服务描述
  promptTemplate?: string; // AI提示模板，JSON格式存储
  createdAt: Date;
  updatedAt: Date;
}

// API密钥模式定义
const ApiKeySchema: Schema = new Schema(
  {
    service: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
      lowercase: true
    },
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    apiKey: { 
      type: String, 
      required: true 
    },
    enabled: { 
      type: Boolean, 
      default: false 
    },
    description: { 
      type: String 
    },
    promptTemplate: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// 避免在测试环境中多次编译模型
const ApiKey = mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', ApiKeySchema);

export default ApiKey; 