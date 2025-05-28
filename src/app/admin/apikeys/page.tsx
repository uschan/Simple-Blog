"use client";

import React, { useState, useEffect } from "react";
import { getAllApiKeys, saveApiKey, deleteApiKey, ApiKeyData } from "@/lib/apiKeys";

// 预设服务配置
const PRESET_SERVICES = [
  {
    service: "deepseek",
    name: "DeepSeek AI",
    description: "DeepSeek API用于文章润色、标题生成、摘要生成和SEO优化",
    url: "https://platform.deepseek.com/api_keys",
    docs: "https://api-docs.deepseek.com/zh-cn/"
  },
  {
    service: "openai",
    name: "OpenAI",
    description: "OpenAI API用于ChatGPT和DALL-E等功能",
    url: "https://platform.openai.com/api-keys",
    docs: "https://platform.openai.com/docs/introduction"
  }
];

// 默认DeepSeek提示模板 - 使用普通文本格式，便于编辑
const DEFAULT_TEMPLATES = {
  deepseek: `{
  "templateVersion": "1.0",
  "articleAnalysis": {
    "systemPrompt": "你是一位专业的内容创作顾问，擅长理解标题并生成结构化创意内容。请分析提供的标题，并生成以下内容：1. 英文URL建议（SEO友好的，使用短横线连接）；2. 两种不同风格的中文短文案；3. 内容适用场景列表。输出必须按照Markdown格式，保持清晰的结构。",
    "example": {
      "title": "对待生命，不妨大胆一点，因为我始终要失去它",
      "response": "### **英文URL（励志+SEO）**\\n**\"dare-to-lose\"**\\n（用 *dare* 和 *lose* 制造反差，突出"大胆失去"的哲思）\\n或更积极版本：\\n**\"live-boldly-now\"**\\n（"此刻即活"，强调当下行动力，含关键词 *boldly*）\\n---\\n### **中文短文案选项A（热血宣言型）**\\n**「生命是张体验券」**\\n反正到期作废，\\n不如刷爆它——\\n去摔最野的跤，\\n尝最怪的味，\\n爱最不可能的人。\\n最后清算时，\\n亏损的都是\\n没敢下单的后悔。（用"体验券/刷爆"类比消费主义，"后悔"点明核心）\\n### **中文短文案选项B（诗意对抗型）**\\n**「向死神发起的挑衅」**\\n你终究要来收走我的呼吸？\\n那在此之前，\\n我要把每个肺泡\\n都装满飓风，\\n直到最后一口气\\n也带着\\n龙卷风的形状。\\n（用"飓风/龙卷风"比喻极致活法，"挑衅"强化张力）\\n---\\n### **适配场景**\\n- **青年文化**（反躺平/冒险精神）\\n- **临终关怀**（生命教育课题）\\n- **旅行品牌**（极限体验项目）"
    }
  }
}`
};

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKeyData | null>(null);
  
  // 新增/编辑表单数据
  const [formData, setFormData] = useState<ApiKeyData>({
    service: '',
    name: '',
    apiKey: '',
    enabled: true,
    description: '',
    promptTemplate: ''
  });
  
  // 加载API密钥数据
  const loadApiKeys = async () => {
    setIsLoading(true);
    try {
      const data = await getAllApiKeys();
      setApiKeys(data);
      setError('');
    } catch (err: any) {
      setError(err.message || '获取API密钥失败');
      console.error('获取API密钥失败:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 组件挂载时加载数据
  useEffect(() => {
    loadApiKeys();
  }, []);
  
  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // 对复选框特殊处理
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // 处理服务选择变化
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const service = e.target.value;
    
    // 如果选择预设服务，自动填充名称和描述
    if (service) {
      const selectedService = PRESET_SERVICES.find(s => s.service === service);
      if (selectedService) {
        setFormData(prev => ({
          ...prev,
          service,
          name: selectedService.name,
          description: selectedService.description,
          // 如果是DeepSeek，提供默认模板选项但不自动填充
          promptTemplate: prev.promptTemplate
        }));
      } else {
        // 自定义服务
        setFormData(prev => ({
          ...prev,
          service,
          name: '',
          description: ''
        }));
      }
    }
  };
  
  // 加载默认提示模板
  const loadDefaultTemplate = () => {
    if (formData.service) {
      // 从DEFAULT_TEMPLATES中获取对应的模板
      const template = DEFAULT_TEMPLATES[formData.service as keyof typeof DEFAULT_TEMPLATES];
      
      if (template) {
        setFormData(prev => ({
          ...prev,
          promptTemplate: template
        }));
        showSuccessMessage(`已加载默认${formData.name}提示模板`);
      } else {
        setError(`没有找到${formData.name}的默认模板`);
      }
    }
  };
  
  // 验证提示模板格式
  const validatePromptTemplate = (templateStr: string): boolean => {
    // 不再强制验证JSON格式，允许任何内容
    return true;
  };

  // 提交表单前验证
  const validateForm = (): boolean => {
    // 在编辑模式下，如果API密钥为空，则认为保持原密钥不变
    if (!formData.service || !formData.name) {
      setError('请填写所有必填字段');
      return false;
    }
    
    // 非编辑模式下，API密钥必填
    if (!isEditing && !formData.apiKey) {
      setError('请填写API密钥');
      return false;
    }
    
    return true;
  };
  
  // 开始编辑API密钥
  const handleEdit = (key: ApiKeyData) => {
    setIsEditing(true);
    setEditingKey(key);
    
    // 处理promptTemplate，确保JSON格式化
    let formattedTemplate = key.promptTemplate || '';
    if (formattedTemplate) {
      try {
        // 尝试格式化JSON
        const templateObj = JSON.parse(formattedTemplate);
        formattedTemplate = JSON.stringify(templateObj, null, 2);
      } catch (e) {
        // 如果解析失败，保持原样
        console.warn('格式化提示模板失败:', e);
      }
    }
    
    setFormData({
      ...key,
      apiKey: '', // 出于安全考虑，不自动填充API密钥
      promptTemplate: formattedTemplate
    });
  };
  
  // 删除API密钥
  const handleDelete = async (service: string) => {
    if (!confirm(`确认删除 ${service} 的API密钥？`)) {
      return;
    }
    
    try {
      await deleteApiKey(service);
      showSuccessMessage(`已删除 ${service} 的API密钥`);
      loadApiKeys();
    } catch (err: any) {
      setError(err.message || '删除API密钥失败');
    }
  };
  
  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // 如果是编辑模式且API密钥为空，使用特殊标记通知后端保持原密钥
      const submittedData = { ...formData };
      if (isEditing && !submittedData.apiKey) {
        // 使用后端认可的占位符，表示保持原密钥不变
        submittedData.apiKey = "__KEEP_ORIGINAL__";
      }
      
      await saveApiKey(submittedData);
      showSuccessMessage(`${isEditing ? '更新' : '添加'} ${formData.name} 密钥成功`);
      
      // 重置表单和状态
      setFormData({
        service: '',
        name: '',
        apiKey: '',
        enabled: true,
        description: '',
        promptTemplate: ''
      });
      setIsEditing(false);
      setEditingKey(null);
      
      // 重新加载数据
      loadApiKeys();
    } catch (err: any) {
      setError(err.message || '保存API密钥失败');
    }
  };
  
  // 取消编辑
  const handleCancel = () => {
    setIsEditing(false);
    setEditingKey(null);
    setFormData({
      service: '',
      name: '',
      apiKey: '',
      enabled: true,
      description: '',
      promptTemplate: ''
    });
  };
  
  // 显示成功消息
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };
  
  // 获取服务文档链接
  const getServiceDocs = (service: string) => {
    const preset = PRESET_SERVICES.find(s => s.service === service);
    return preset?.docs || '#';
  };
  
  // 获取API申请链接
  const getServiceApiUrl = (service: string) => {
    const preset = PRESET_SERVICES.find(s => s.service === service);
    return preset?.url || '#';
  };
  
  return (
    <div className="container mx-auto max-w-5xl">
      {/* 页面标题 */}
      <h1 className="text-xl font-semibold underline underline-offset-8 decoration-wavy mb-4 pb-2">/// AI服务密钥管理 ///</h1>
      
      {/* 成功消息 */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      {/* 错误消息 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError('')}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {/* API密钥表单 */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-sm mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium mb-4">{isEditing ? '编辑' : '添加'}API密钥</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* 服务选择 */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                服务类型 <span className="text-red-500">*</span>
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleServiceChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-zinc-700 dark:text-white"
                required
                disabled={isEditing}
              >
                <option value="">选择服务...</option>
                {PRESET_SERVICES.map(service => (
                  <option key={service.service} value={service.service}>
                    {service.name}
                  </option>
                ))}
                <option value="custom">自定义服务</option>
              </select>
            </div>
            
            {/* 显示名称 */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                显示名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-zinc-700 dark:text-white"
                placeholder="如：DeepSeek AI"
                required
              />
            </div>
          </div>
          
          {/* 自定义服务ID - 仅在选择自定义服务且非编辑模式时显示 */}
          {formData.service === 'custom' && !isEditing && (
            <div className="form-group mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                服务ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-zinc-700 dark:text-white"
                placeholder="小写字母，如：custom-ai"
                required
                pattern="[a-z0-9-]+"
              />
              <small className="text-gray-500 dark:text-gray-400">
                仅使用小写字母、数字和连字符，如：custom-ai
              </small>
            </div>
          )}
          
          {/* API密钥 */}
          <div className="form-group mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API密钥 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="apiKey"
              value={formData.apiKey}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-zinc-700 dark:text-white"
              placeholder={isEditing ? "不填写则保持原密钥不变" : "输入API密钥"}
              required={!isEditing}
            />
            {formData.service && (
              <small className="text-gray-500 dark:text-gray-400">
                <a
                  href={getServiceApiUrl(formData.service)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <i className="fas fa-external-link-alt mr-1"></i>
                  获取{formData.name || '服务'}API密钥
                </a>
              </small>
            )}
          </div>
          
          {/* 提示模板配置 - 现在对所有服务可用 */}
          <div className="form-group mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                提示模板
              </label>
              {formData.service && (
                <button
                  type="button"
                  onClick={loadDefaultTemplate}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  加载默认模板
                </button>
              )}
            </div>
            <textarea
              name="promptTemplate"
              value={formData.promptTemplate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-zinc-700 dark:text-white font-mono text-sm"
              rows={10}
              placeholder="输入提示模板，可以是JSON格式或普通文本"
            />
            <small className="text-gray-500 dark:text-gray-400 block mt-1">
              提示模板用于定义AI助手的输出格式。推荐使用JSON格式，但也支持其他格式。
            </small>
          </div>
          
          {/* 描述 */}
          <div className="form-group mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-zinc-700 dark:text-white"
              rows={2}
              placeholder="可选描述信息"
            />
          </div>
          
          {/* 启用状态 */}
          <div className="form-group mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="enabled"
                checked={formData.enabled}
                onChange={handleInputChange}
                id="enabled"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                启用此API密钥
              </label>
            </div>
          </div>
          
          {/* 按钮组 */}
          <div className="flex justify-end space-x-3">
            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                取消
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isEditing ? '更新' : '保存'}
            </button>
          </div>
        </form>
      </div>
      
      {/* API密钥列表 */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium p-6 pb-3 border-b border-gray-200 dark:border-gray-700">已配置的API密钥</h2>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">加载中...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>还没有配置任何API密钥</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    服务
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    密钥
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-gray-700">
                {apiKeys.map((key) => (
                  <tr key={key.service} className="hover:bg-gray-50 dark:hover:bg-zinc-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {key.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {key.service}
                            {key.description && (
                              <span className="block mt-1">
                                {key.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <code className="bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded">
                          {key.apiKey}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        key.enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {key.enabled ? '已启用' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(key)}
                          className="text-primary hover:text-primary-dark"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(key.service)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                        <a
                          href={getServiceDocs(key.service)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <i className="fas fa-book"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 