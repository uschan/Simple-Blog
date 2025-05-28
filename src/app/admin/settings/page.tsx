"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
// import FileUploader from "@/components/admin/FileUploader";
import { get, post } from "@/lib/api"; // 导入API工具
import { convertToApiImageUrl } from "@/lib/utils"; // 添加导入
import dynamic from 'next/dynamic';

// 使用完全相同的导入方式，确保与文章页面一致
const FileUploader = dynamic(() => import('@/components/admin/FileUploader'), { 
  ssr: false,
  loading: () => <div className="px-3 py-2 rounded-lg border border-primary-light">加载中...</div>
});

// 创建安全的文件上传包装组件
const SafeImageUploader = ({
  onUploadSuccess,
  uploadType,
  accept,
  buttonText,
  className = '',
  fileType = '图片'
}: {
  onUploadSuccess: (path: string) => void;
  uploadType: string;
  accept: string;
  buttonText: string;
  className?: string;
  fileType?: string;
}) => {
  // 使用独立state管理上传状态，与外部隔离
  const [isUploading, setIsUploading] = useState(false);
  
  const handleUploadSuccess = (filePath: string) => {
    onUploadSuccess(filePath);
  };
  
  return (
    <div className="safe-uploader">
      {!isUploading && (
        <FileUploader
          key={`${uploadType}-uploader-${Date.now()}`} // 确保每次渲染都是新的组件
          onUploadSuccess={(path) => {
            setIsUploading(true);
            setTimeout(() => {
              handleUploadSuccess(path);
              setIsUploading(false);
            }, 500); // 增加延迟到500ms，给状态更新留出更多时间
          }}
          onUploadError={(error) => console.error(`${fileType}上传失败:`, error)}
          fileType={fileType}
          accept={accept}
          uploadType={uploadType}
          buttonText={buttonText}
          className={className}
        />
      )}
      {isUploading && (
        <div className={`px-3 py-2 rounded-lg ${className}`}>
          <i className="fa-solid fa-spinner fa-spin mr-1"></i> 处理中...
        </div>
      )}
    </div>
  );
};

// 系统设置的数据结构
interface SiteSettings {
  // 网站基本信息
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  logo: string;
  favicon: string;
  
  // 版权说明
  copyright: string;
  
  // 社交媒体链接
  socials: Array<{
    name: string;
    url: string;
    icon: string;
  }>;
  
  // 统计代码 - 新格式
  analytics: {
    type: 'google' | 'umami' | 'custom';
    trackingCode: string;
  };
  // 向后兼容原来的格式
  analyticsCode?: string;
}

// 系统设置页面组件
export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // 系统设置 - 使用空数据初始化，等待API加载
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  // 加载设置数据
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // 添加时间戳防止缓存
      const timestamp = new Date().getTime();
      const response = await get(`/api/admin/settings?t=${timestamp}`);
      
      // 更新设置数据
      if (response && response.data) {
        // 处理数据，确保格式正确
        const data = response.data;
        
        // 确保socials是数组
        let socials = [];
        try {
          if (typeof data.socials === 'string') {
            // 如果是字符串，尝试解析JSON
            socials = JSON.parse(data.socials);
          } else if (Array.isArray(data.socials)) {
            // 如果已经是数组，直接使用
            socials = data.socials;
          } else if (data.socials && typeof data.socials === 'object') {
            // 如果是对象，转换为数组
            socials = [data.socials];
          }
        } catch (e) {
          // 使用空数组作为默认值
          socials = [];
        }
        
        // 处理分析代码，优先使用新格式，兼容旧格式
        let analyticsType = 'custom';
        let analyticsCode = '';
        
        if (data.analytics) {
          // 使用新格式
          analyticsType = data.analytics.type || 'custom';
          analyticsCode = data.analytics.trackingCode || '';
        } else if (data.analyticsCode) {
          // 兼容旧格式
          analyticsType = 'custom';
          analyticsCode = data.analyticsCode;
          }
        
        // 构建格式化的设置数据
        const formattedSettings: SiteSettings = {
          siteName: data.siteName || '',
          siteDescription: data.siteDescription || '',
          siteKeywords: data.siteKeywords || '',
          logo: data.logo || '/images/logo.svg',
          favicon: data.favicon || '/images/favicon.ico',
          copyright: data.copyright || '',
          socials: socials,
          analytics: {
            type: analyticsType as 'google' | 'umami' | 'custom',
            trackingCode: analyticsCode
          }
        };
        
        // 更新状态
        setSettings(formattedSettings);
      } else {
        alert('获取设置数据失败，请刷新页面重试');
      }
    } catch (error) {
      alert('加载设置数据出错，请刷新页面');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 组件挂载时加载数据
  useEffect(() => {
    loadSettings();
  }, []);
  
  // 组件加载后无需额外处理
  useEffect(() => {
    // 已在loadSettings中初始化所有必要字段
  }, [isLoading, settings]);
  
  // 保存设置
  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setIsSaving(true);
    try {
      // 确保正确的数据格式
      const dataToSave = {
        ...settings,
        // 确保分析代码使用正确的格式
        analytics: {
          type: settings.analytics?.type || 'custom',
          trackingCode: settings.analytics?.trackingCode || settings.analyticsCode || ''
        }
      };
      
      // 发送数据到服务器
      const response = await post('/api/admin/settings', dataToSave);
      
      // 显示成功消息
      setSuccessMessage('设置已成功保存！');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // 强制重新加载数据，添加时间戳防止缓存
      await loadSettings();
    } catch (error) {
      alert(`保存设置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // 添加社交媒体
  const addSocial = () => {
    if (!settings) return;
    
    // 确保socials是数组
    const currentSocials = Array.isArray(settings.socials) ? settings.socials : [];
    
    setSettings({
      ...settings,
      socials: [...currentSocials, { name: '', url: '', icon: '' }]
    });
  };
  
  // 删除社交媒体
  const removeSocial = (index: number) => {
    if (!settings) return;
    
    // 确保socials是数组
    if (!Array.isArray(settings.socials)) {
      console.error('[设置] 试图从非数组中删除社交媒体');
      return;
    }
    
    const newSocials = [...settings.socials];
    newSocials.splice(index, 1);
    setSettings({
      ...settings,
      socials: newSocials
    });
  };
  
  // 更新社交媒体
  const updateSocial = (index: number, field: string, value: string) => {
    if (!settings) return;
    
    // 确保socials是数组
    if (!Array.isArray(settings.socials)) {
      console.error('[设置] 试图更新非数组中的社交媒体');
      return;
    }
    
    const newSocials = [...settings.socials];
    newSocials[index] = { 
      ...newSocials[index], 
      [field]: value 
    };
    setSettings({
      ...settings,
      socials: newSocials
    });
  };
  
  // 显示成功消息的函数
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    // 使用一个稳定的超时器，避免多个超时器相互干扰
    const timer = setTimeout(() => setSuccessMessage(''), 3000);
    return () => clearTimeout(timer); // 返回清理函数用于组件卸载时
  };
  
  // 加载中状态
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">加载设置中...</span>
      </div>
    );
  }
  
  // 数据加载失败或未初始化
  if (!settings) {
    return (
      <div className="container mx-auto max-w-5xl">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg text-center">
          <h3 className="text-lg font-medium text-red-600 dark:text-red-400">无法加载设置数据</h3>
          <p className="mt-2">请检查网络连接并刷新页面，或联系管理员</p>
          <button
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
            onClick={() => loadSettings()}
          >
            重试加载
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-5xl">
      {/* 成功提示 */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200 rounded-lg">
          <i className="fas fa-check-circle mr-2"></i>
          {successMessage}
        </div>
      )}
      
      {/* 设置表单 */}
      <form onSubmit={saveSettings}>
        {/* 网站基本信息 */}
        <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold underline underline-offset-8 decoration-wavy mb-4 pb-2">/// 网站基本信息 ///</h2>
            
            {/* 网站名称 */}
            <div className="mb-4">
              <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◜网站名称◝</label>
              <input 
                type="text" 
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                className="w-full text-xs italic px-4 py-2 rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200 dark:border-0"
              />
            </div>
            
            {/* 网站描述 */}
            <div className="mb-4">
              <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◜网站描述◝</label>
              <textarea 
                value={settings.siteDescription}
                onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                className="w-full text-xs italic px-4 py-2 rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200 dark:border-0" 
                rows={3}
              ></textarea>
            </div>
            
            {/* 网站关键词 */}
            <div className="mb-2">
              <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◜网站关键词◝</label>
              <input 
                type="text" 
                value={settings.siteKeywords}
                onChange={(e) => setSettings({...settings, siteKeywords: e.target.value})}
                className="w-full text-xs italic px-4 py-2 rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200 dark:border-0"
                placeholder="博客,技术,分享,设计,艺术"
              />
            </div>
        </div>
        {/* 网站标识 */}
        <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4 mb-6">                        
            {/* Logo 上传 */}
            <div className="border-b pb-4 mb-2">
              <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◜网站 Logo◝</label>
              <div className="flex items-center space-x-4">
                <div>
                  <Image src={convertToApiImageUrl(settings.logo)} alt="Logo" width={32} height={32} className="rounded-lg h-8 w-8" />
                </div>
                <SafeImageUploader
                  onUploadSuccess={(filePath) => {
                    if (settings) {
                      setSettings({
                        ...settings, 
                        logo: filePath
                      });
                      setSuccessMessage('Logo上传成功！');
                      setTimeout(() => setSuccessMessage(''), 3000);
                    }
                  }}
                  fileType="Logo"
                  accept="image/svg+xml,image/png,image/jpeg"
                  uploadType="image"
                  buttonText={settings.logo ? "更换图片" : "上传图片"}
                  className="text-xs bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300"
                />
              </div>
            </div>
            
            {/* Favicon 上传 */}
            <div className="mb-2">
              <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◜网站图标 Favicon◝</label>
              <div className="flex items-center space-x-4">
                <div>
                  <Image src={convertToApiImageUrl(settings.favicon)} alt="Favicon" width={32} height={32} className="h-8 w-8" />
                </div>
                <SafeImageUploader
                  onUploadSuccess={(filePath) => {
                    if (settings) {
                      setSettings({
                        ...settings, 
                        favicon: filePath
                      });
                      setSuccessMessage('图标上传成功！');
                      setTimeout(() => setSuccessMessage(''), 3000);
                    }
                  }}
                  fileType="图标"
                  accept="image/x-icon,image/png"
                  uploadType="image"
                  buttonText={settings.favicon ? "更换图标" : "上传图标"}
                  className="text-xs bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300"
                />
              </div>
            </div>
        </div>
        {/* Footer調用 */}
        <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold underline underline-offset-8 decoration-wavy mb-4 pb-2">/// Footer調用 ///</h2>
            {/* 版权说明 */}
            <div className="mb-4">
              <h2 className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◜版权说明◝</h2>
                <input 
                  type="text" 
                  value={settings.copyright}
                  onChange={(e) => setSettings({...settings, copyright: e.target.value})}
                  className="w-full text-xs italic dark:text-green-700 px-4 py-2 rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200 dark:border-0"
                />
            </div>

            {/* 社交媒体链接 */}
            <div className="mb-2">
                <h2 className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◜社交媒体◝</h2>
                  {Array.isArray(settings.socials) ? settings.socials.map((social, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-3">
                      <input 
                        type="text" 
                        value={social.name}
                        onChange={(e) => updateSocial(index, 'name', e.target.value)}
                        placeholder="社交媒体名称" 
                        className="px-3 py-2 text-xs italic rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200 dark:border-0"
                      />
                      <input 
                        type="text" 
                        value={social.icon}
                        onChange={(e) => updateSocial(index, 'icon', e.target.value)}
                        placeholder="FontAwesome图标类名" 
                        className="px-3 py-2 text-xs italic rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200 dark:border-0"
                      />
                      <input 
                        type="text" 
                        value={social.url}
                        onChange={(e) => updateSocial(index, 'url', e.target.value)}
                        placeholder="URL地址" 
                        className="flex-1 px-4 py-2 text-xs italic rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200 dark:border-0"
                      />
                      <button 
                        type="button" 
                        onClick={() => removeSocial(index)} 
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  )) : (
                    <div className="text-yellow-500 text-sm mb-2">
                      <i className="fas fa-exclamation-triangle mr-1"></i>
                      社交媒体数据格式有误
                    </div>
                  )}
                  
                  <button 
                    type="button" 
                    onClick={addSocial} 
                    className="px-2 py-2 text-xs bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    <i className="fa-solid fa-plus mr-1"></i> 添加社交媒体
                  </button>
            </div>
        </div>
        <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4">               
            {/* 统计代码 */}
            <div className="mb-4">
              <div>
                <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◜统计代码◝</label>
                <div className="mb-2 text-xs text-gray-600 dark:text-gray-400 italic">
                  请直接粘贴完整的统计代码，支持同时添加多个统计服务（Google Analytics、百度统计、Umami等）
                </div>
                <textarea 
                  value={settings.analytics?.trackingCode || ''}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      analytics: {
                        type: 'custom',
                        trackingCode: e.target.value
                      }
                    });
                  }}
                  className="w-full text-xs italic px-4 py-2 rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200 dark:border-0" 
                  rows={12}
                  placeholder="<!-- 示例：在此粘贴您的完整统计代码 -->
<script defer src='https://cloud.umami.is/script.js' data-website-id='your-website-id'></script>
<!-- Google tag (gtag.js) -->
<script async src='https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX'></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXX');
</script>"
                ></textarea>
              </div>
            </div>
        </div>
          
        {/* 保存按钮 */}
        <div className="flex justify-center p-6">
          <button 
            type="submit" 
            disabled={isSaving}
            className="px-6 py-2 rounded-lg transition-colors border border-primary-light bg-primary text-white hover:bg-primary-dark"
            title="如果刚刚上传了图片，请等待处理完成后再保存"
          >
            {isSaving ? '保存中...' : '保存设置'}
          </button>
        </div>        
      </form>
    </div>
  );
} 