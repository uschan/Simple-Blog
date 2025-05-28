export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ApiKey } from '@/models';

// 获取所有API密钥
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 获取所有API密钥配置，但隐藏完整密钥值
    const apiKeys = await ApiKey.find().lean();
    
    // 处理密钥显示 - 仅显示部分密钥（如前4后4字符）
    const safeApiKeys = apiKeys.map(key => {
      const apiKeyStr = key.apiKey || '';
      let maskedKey = '';
      
      if (apiKeyStr.length > 8) {
        // 只显示前4位和后4位，中间用*替代
        maskedKey = `${apiKeyStr.substring(0, 4)}****${apiKeyStr.substring(apiKeyStr.length - 4)}`;
      } else if (apiKeyStr.length > 0) {
        // 对于短密钥，只显示第一位和最后一位
        maskedKey = `${apiKeyStr.substring(0, 1)}****${apiKeyStr.substring(apiKeyStr.length - 1)}`;
      }
      
      return {
        ...key,
        apiKey: maskedKey,
        fullApiKey: undefined // 确保不返回完整密钥
      };
    });
    
    return NextResponse.json({ 
      message: 'Success',
      data: safeApiKeys
    });
  } catch (error: any) {
    console.error('获取API密钥失败:', error);
    return NextResponse.json(
      { message: '获取API密钥失败', error: error.message },
      { status: 500 }
    );
  }
}

// 保存API密钥
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();
    
    console.log('[API端点] 保存API密钥请求:', {
      service: data.service,
      name: data.name,
      hasApiKey: !!data.apiKey,
      enabled: data.enabled,
      hasTemplate: !!data.promptTemplate,
      templateLength: data.promptTemplate ? data.promptTemplate.length : 0
    });
    
    // 验证请求数据
    if (!data.service || !data.name) {
      console.error('[API端点] 缺少必要的API密钥信息');
      return NextResponse.json(
        { message: '缺少必要的API密钥信息' },
        { status: 400 }
      );
    }
    
    // 规范化service字段 - 全部小写，移除空格
    const normalizedService = data.service.toLowerCase().trim();
    
    // 查找是否已存在相同service的记录
    const existingKey = await ApiKey.findOne({ service: normalizedService });
    
    let result;
    if (existingKey) {
      console.log(`[API端点] 更新现有API密钥 service=${normalizedService}`);
      // 处理特殊标记 __KEEP_ORIGINAL__ - 表示保持原密钥不变
      const apiKeyToUpdate = data.apiKey === "__KEEP_ORIGINAL__" 
        ? existingKey.apiKey // 使用原有密钥
        : data.apiKey;

      // 更新现有记录
      result = await ApiKey.findByIdAndUpdate(
        existingKey._id,
        {
          name: data.name,
          apiKey: apiKeyToUpdate,
          enabled: data.enabled !== undefined ? data.enabled : true,
          description: data.description || '',
          promptTemplate: data.promptTemplate || ''
        },
        { new: true }
      );
      console.log(`[API端点] 更新成功 id=${result._id}`);
    } else {
      console.log(`[API端点] 创建新的API密钥 service=${normalizedService}`);
      // 创建新记录必须提供API密钥
      if (!data.apiKey || data.apiKey === "__KEEP_ORIGINAL__") {
        console.error('[API端点] 新建API密钥时未提供有效密钥');
        return NextResponse.json(
          { message: '新建API密钥时必须提供有效的密钥值' },
          { status: 400 }
        );
      }
      
      // 创建新记录
      const newApiKey = new ApiKey({
        service: normalizedService,
        name: data.name,
        apiKey: data.apiKey,
        enabled: data.enabled !== undefined ? data.enabled : true,
        description: data.description || '',
        promptTemplate: data.promptTemplate || ''
      });
      
      result = await newApiKey.save();
      console.log(`[API端点] 创建成功 id=${result._id}`);
    }
    
    // 返回结果时隐藏完整密钥
    const apiKeyStr = result.apiKey || '';
    const maskedKey = apiKeyStr.length > 8
      ? `${apiKeyStr.substring(0, 4)}****${apiKeyStr.substring(apiKeyStr.length - 4)}`
      : (apiKeyStr.length > 0 ? `${apiKeyStr.substring(0, 1)}****${apiKeyStr.substring(apiKeyStr.length - 1)}` : '');
    
    console.log('[API端点] 返回成功结果');
    return NextResponse.json({ 
      message: '保存API密钥成功',
      data: {
        ...result.toObject(),
        apiKey: maskedKey
      }
    });
  } catch (error: any) {
    console.error('[API端点] 保存API密钥失败:', error);
    return NextResponse.json(
      { message: '保存API密钥失败', error: error.message },
      { status: 500 }
    );
  }
}

// 删除API密钥
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    // 从URL中获取要删除的service参数
    const url = new URL(request.url);
    const service = url.searchParams.get('service');
    
    if (!service) {
      return NextResponse.json(
        { message: '缺少service参数' },
        { status: 400 }
      );
    }
    
    // 查找并删除指定的API密钥
    const deletedKey = await ApiKey.findOneAndDelete({ service: service.toLowerCase().trim() });
    
    if (!deletedKey) {
      return NextResponse.json(
        { message: '未找到指定的API密钥' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: '删除API密钥成功',
      data: {
        service: deletedKey.service,
        name: deletedKey.name
      }
    });
  } catch (error: any) {
    console.error('删除API密钥失败:', error);
    return NextResponse.json(
      { message: '删除API密钥失败', error: error.message },
      { status: 500 }
    );
  }
}

// 获取单个API密钥的完整信息 (主要用于验证和使用)
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();
    
    // 验证请求数据
    if (!data.service) {
      console.error('[API端点] 获取API密钥时缺少service参数');
      return NextResponse.json(
        { message: '缺少service参数' },
        { status: 400 }
      );
    }
    
    const normalizedService = data.service.toLowerCase().trim();
    console.log(`[API端点] 获取API密钥请求 service=${normalizedService}`);
    
    // 查找指定的API密钥
    const apiKey = await ApiKey.findOne({ 
      service: normalizedService,
      enabled: true
    });
    
    if (!apiKey) {
      console.warn(`[API端点] 未找到服务 ${normalizedService} 的API密钥或密钥未启用`);
      return NextResponse.json(
        { message: '未找到指定的API密钥或API密钥未启用' },
        { status: 404 }
      );
    }
    
    console.log(`[API端点] 找到API密钥 id=${apiKey._id}, 模板长度=${apiKey.promptTemplate ? apiKey.promptTemplate.length : 0}`);
    
    // 返回完整信息，包括模板
    return NextResponse.json({ 
      message: 'Success',
      data: apiKey
    });
  } catch (error: any) {
    console.error('[API端点] 获取API密钥失败:', error);
    return NextResponse.json(
      { message: '获取API密钥失败', error: error.message },
      { status: 500 }
    );
  }
} 