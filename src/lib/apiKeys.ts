import { get, post, del, put } from './api';

// 定义API密钥类型
export interface ApiKeyData {
  _id?: string;
  service: string;
  name: string;
  apiKey: string;
  enabled: boolean;
  description?: string;
  promptTemplate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 获取所有API密钥（密钥会被部分隐藏）
export async function getAllApiKeys() {
  try {
    console.log('[API密钥] 获取所有API密钥');
    const response = await get('/api/admin/apikeys');
    console.log(`[API密钥] 获取成功，共${response.data ? response.data.length : 0}个`);
    return response.data || [];
  } catch (error) {
    console.error('[API密钥] 获取API密钥失败:', error);
    throw error;
  }
}

// 保存API密钥（新增或更新）
export async function saveApiKey(apiKeyData: ApiKeyData) {
  try {
    console.log(`[API密钥] 保存API密钥 service=${apiKeyData.service}, name=${apiKeyData.name}`);
    const response = await post('/api/admin/apikeys', apiKeyData);
    console.log('[API密钥] 保存成功');
    return response.data;
  } catch (error) {
    console.error('[API密钥] 保存API密钥失败:', error);
    throw error;
  }
}

// 删除API密钥
export async function deleteApiKey(service: string) {
  try {
    console.log(`[API密钥] 删除API密钥 service=${service}`);
    const response = await del(`/api/admin/apikeys?service=${encodeURIComponent(service)}`);
    console.log('[API密钥] 删除成功');
    return response.data;
  } catch (error) {
    console.error('[API密钥] 删除API密钥失败:', error);
    throw error;
  }
}

// 获取指定服务的API密钥（返回完整密钥）
export async function getApiKey(service: string) {
  try {
    console.log(`[API密钥] 获取指定服务的API密钥 service=${service}`);
    const response = await put('/api/admin/apikeys', { service });
    
    if (!response.data) {
      console.warn(`[API密钥] 未找到服务 ${service} 的API密钥`);
      return null;
    }
    
    console.log(`[API密钥] 获取成功，name=${response.data.name}, enabled=${response.data.enabled}`);
    // 检查是否有promptTemplate
    if (response.data.promptTemplate) {
      console.log(`[API密钥] 模板长度：${response.data.promptTemplate.length}字符`);
    } else {
      console.warn(`[API密钥] 服务 ${service} 未配置提示模板`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`[API密钥] 获取${service}密钥失败:`, error);
    throw error;
  }
}

// 使用指定服务的API密钥
export async function useApiKey(service: string, callback: (apiKey: string) => Promise<any>) {
  try {
    console.log(`[API密钥] 使用服务 ${service} 的API密钥`);
    // 获取API密钥
    const apiKeyResponse = await getApiKey(service);
    
    if (!apiKeyResponse || !apiKeyResponse.apiKey) {
      console.error(`[API密钥] 未找到有效的${service}服务密钥`);
      throw new Error(`未找到有效的${service}服务密钥`);
    }
    
    // 使用API密钥执行回调
    console.log(`[API密钥] 成功获取密钥，开始执行回调`);
    return await callback(apiKeyResponse.apiKey);
  } catch (error) {
    console.error(`[API密钥] 使用${service}服务失败:`, error);
    throw error;
  }
} 