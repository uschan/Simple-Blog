import { useApiKey, getApiKey } from './apiKeys';
import axios from 'axios';

// DeepSeek API相关常量
const DEEPSEEK_API_URL = 'https://api.deepseek.com';
const DEEPSEEK_SERVICE = 'deepseek';

// 消息类型定义
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 调用DeepSeek API
 * @param messages 消息列表
 * @param options 选项
 * @returns 
 */
export async function callDeepSeekAPI(messages: Message[], options = {}) {
  return await useApiKey(DEEPSEEK_SERVICE, async (apiKey) => {
    try {
      console.log('[DeepSeek API] 发送消息:', JSON.stringify(messages, null, 2));
      
      const response = await axios.post(
        `${DEEPSEEK_API_URL}/chat/completions`,
        {
          model: "deepseek-chat", // 使用DeepSeek-V3模型
          messages: messages,
          stream: false,
          ...options
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('[DeepSeek API] 调用失败:', error.response?.data || error.message);
      throw new Error(`DeepSeek API调用失败: ${error.response?.data?.error?.message || error.message}`);
    }
  });
}

/**
 * 一键分析文章标题和内容
 * @param title 文章标题
 * @param content 文章内容 (可选)
 * @returns 分析结果
 */
export async function analyzeArticle(title: string, content?: string) {
  try {
    // 获取API密钥配置
    console.log('[分析文章] 开始获取DeepSeek API密钥配置');
    const apiKeyData = await getApiKey(DEEPSEEK_SERVICE);
    
    if (!apiKeyData) {
      console.error('[分析文章] 未找到DeepSeek API密钥配置');
      throw new Error('未找到DeepSeek API配置，请在管理页面配置API密钥');
    }
    
    console.log('[分析文章] 成功获取API密钥配置:', JSON.stringify({
      service: apiKeyData.service,
      name: apiKeyData.name,
      hasTemplate: !!apiKeyData.promptTemplate,
      templateLength: apiKeyData.promptTemplate ? apiKeyData.promptTemplate.length : 0
    }));
    
    // 构建消息
    let messages: Message[] = [];
    
    // 尝试从模板中获取system prompt
    if (apiKeyData.promptTemplate) {
      // 修复和清理模板内容
      let templateText = apiKeyData.promptTemplate;
      
      // 尝试修复常见的JSON格式错误
      try {
        // 直接尝试解析，看是否有效
        const template = JSON.parse(templateText);
        console.log('[分析文章] 模板是有效的JSON格式');
        
        // 如果解析成功，检查并使用模板内容
        if (template.articleAnalysis && template.articleAnalysis.systemPrompt) {
          console.log('[分析文章] 从模板中提取系统提示');
          
          // 使用模板中的系统提示
          messages.push({
            role: 'system',
            content: template.articleAnalysis.systemPrompt
          });
          
          // 如果有示例，添加到系统提示
          if (template.articleAnalysis.example) {
            console.log('[分析文章] 添加模板中的示例');
            messages[0].content += `\n\n示例：\n标题：${template.articleAnalysis.example.title}\n\n${template.articleAnalysis.example.response}`;
          }
        } else {
          throw new Error('模板结构不正确');
        }
      } catch (error) {
        console.warn('[分析文章] 模板不是有效的JSON格式，尝试提取关键内容:', error);
        
        // 使用正则表达式提取关键内容
        try {
          // 提取systemPrompt
          const systemPromptMatch = templateText.match(/"systemPrompt"\s*:\s*"([^"]+)"/);
          if (!systemPromptMatch) {
            console.warn('[分析文章] 无法提取systemPrompt，使用文本作为模板');
            messages.push({
              role: 'system',
              content: templateText.substring(0, 1500) // 使用前1500个字符作为提示
            });
          } else {
            const systemPrompt = systemPromptMatch[1];
            console.log('[分析文章] 成功提取systemPrompt');
            
            // 提取示例标题和响应
            const titleMatch = templateText.match(/"title"\s*:\s*"([^"]+)"/);
            const responseMatch = templateText.match(/"response"\s*:\s*"([^"]+)"/);
            
            let prompt = systemPrompt;
            
            if (titleMatch && responseMatch) {
              console.log('[分析文章] 成功提取示例');
              prompt += `\n\n示例：\n标题：${titleMatch[1]}\n\n${responseMatch[1]}`;
            }
            
            messages.push({
              role: 'system',
              content: prompt
            });
          }
        } catch (extractError) {
          console.error('[分析文章] 提取模板内容失败:', extractError);
          // 使用文本前1500个字符作为提示
          messages.push({
            role: 'system',
            content: templateText.substring(0, 1500)
          });
        }
      }
    } else {
      console.warn('[分析文章] 未找到模板，使用默认提示');
      // 使用默认提示
      messages.push({
        role: 'system',
        content: "你是一位专业的内容创作顾问，擅长理解标题并生成结构化创意内容。请分析提供的标题，并生成以下内容：1. 英文URL建议（SEO友好的，使用短横线连接）；2. 两种不同风格的中文短文案；3. 内容适用场景列表。"
      });
    }
    
    // 用户消息 - 添加标题和内容
    let userContent = `请分析这个标题：${title}`;
    if (content) {
      userContent += `\n\n以下是相关内容：\n${content}`;
    }
    
    messages.push({
      role: 'user',
      content: userContent
    });
    
    console.log('[分析文章] 消息构建完成，准备调用API');
    console.log('[分析文章] 系统提示:', messages[0].content.substring(0, 200) + '...');
    
    // 调用API
    return await callDeepSeekAPI(messages);
  } catch (error: any) {
    console.error('[分析文章] 处理失败:', error);
    throw error;
  }
}

/**
 * 润色文章内容
 * @param content 文章内容
 * @returns 润色后的内容
 */
export async function polishArticle(content: string) {
  const messages: Message[] = [
    { 
      role: "system", 
      content: "你是一位专业的文章编辑，擅长优化文章表达，使文章更加流畅、专业且吸引人。保持原文的核心观点和结构，但提升语言表达质量。" 
    },
    { 
      role: "user", 
      content: `请帮我优化以下文章内容，提升表达质量但保留原意：\n\n${content}` 
    }
  ];
  
  return await callDeepSeekAPI(messages);
}

/**
 * 生成文章标题
 * @param content 文章内容
 * @param count 生成标题数量
 * @returns 标题列表
 */
export async function generateTitles(content: string, count: number = 5) {
  const messages: Message[] = [
    { 
      role: "system", 
      content: "你是一位专业的标题创作专家，擅长为文章创作吸引人且准确的标题。" 
    },
    { 
      role: "user", 
      content: `请根据以下文章内容，生成${count}个不同风格的标题选项，包括吸引眼球型、专业型、问题型等多种风格。以JSON格式返回，key为标题类型，value为标题内容：\n\n${content}` 
    }
  ];
  
  const response = await callDeepSeekAPI(messages);
  
  try {
    // 尝试解析JSON响应
    return JSON.parse(response);
  } catch (e) {
    // 如果解析失败，直接返回文本
    return { "raw": response };
  }
}

/**
 * 生成文章摘要
 * @param content 文章内容
 * @returns 摘要内容
 */
export async function generateSummary(content: string) {
  const messages: Message[] = [
    { 
      role: "system", 
      content: "你是一位专业的内容分析师，擅长提取文章的核心观点并生成简洁的摘要。" 
    },
    { 
      role: "user", 
      content: `请为以下文章生成一段200字以内的摘要，突出文章的主要观点和价值：\n\n${content}` 
    }
  ];
  
  return await callDeepSeekAPI(messages);
}

/**
 * 生成SEO优化建议
 * @param title 文章标题
 * @param content 文章内容
 * @returns SEO优化建议
 */
export async function generateSEO(title: string, content: string) {
  const messages: Message[] = [
    { 
      role: "system", 
      content: "你是一位SEO专家，擅长分析文章内容并提供SEO优化建议。" 
    },
    { 
      role: "user", 
      content: `请分析以下文章标题和内容，提供以下SEO优化建议：
    1. 生成一个符合SEO规范的URL slug（使用英文、短横线分隔）
    2. 提取5-8个关键词（按重要性排序）
    3. 提供3条提升SEO效果的具体建议
    
    以JSON格式返回，包含url_slug、keywords和suggestions三个字段。
    
    标题：${title}
    
    内容：${content}` 
    }
  ];
  
  const response = await callDeepSeekAPI(messages);
  
  try {
    return JSON.parse(response);
  } catch (e) {
    return { "raw": response };
  }
} 