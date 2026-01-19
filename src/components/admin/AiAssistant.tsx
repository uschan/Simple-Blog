"use client";

import React, { useState } from 'react';
import { analyzeArticle } from '@/lib/aiService';
import { getApiKey } from '@/lib/apiKeys';

interface AiAssistantProps {
  articleTitle: string;
  articleContent: string;
  onPolishApply: (polishedContent: string) => void;
  onTitleSelect: (title: string) => void;
  onSummaryApply: (summary: string) => void;
  onSeoApply: (slug: string, keywords: string[]) => void;
}

export default function AiAssistant({
  articleTitle,
  articleContent,
  onPolishApply,
  onTitleSelect,
  onSummaryApply,
  onSeoApply
}: AiAssistantProps) {
  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [templateInfo, setTemplateInfo] = useState('');
  
  // 显示调试信息
  const handleShowDebug = async () => {
    try {
      const apiKeyData = await getApiKey('deepseek');
      if (apiKeyData && apiKeyData.promptTemplate) {
        setTemplateInfo(apiKeyData.promptTemplate);
      } else {
        setTemplateInfo('未找到模板或模板为空');
      }
      setShowDebug(!showDebug);
    } catch (err: any) {
      setError(err.message || '获取模板信息失败');
    }
  };
  
  // 一键分析文章
  const handleAnalyzeArticle = async () => {
    if (!articleTitle.trim()) {
      setError('请先输入文章标题');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await analyzeArticle(articleTitle, articleContent);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || 'AI分析失败，请检查API密钥和网络连接');
      console.error('分析文章失败:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 从分析结果中提取URL并应用
  const handleApplyURL = () => {
    console.log('[提取URL] 开始分析结果:', analysisResult.substring(0, 500));
    
    let slug = '';
    
    // 1. 尝试多种格式匹配URL slug
    // 格式1: 英文URL: "slug-here" 或 英文URL："slug-here"
    const urlSectionMatch1 = analysisResult.match(/(?:英文URL|URL)[:：]\s*["""]([a-z0-9-]+)["""]/i);
    if (urlSectionMatch1 && urlSectionMatch1[1]) {
      slug = urlSectionMatch1[1];
      console.log('[提取URL] 通过格式1匹配到:', slug);
    }
    
    // 格式2: 英文URL建议: slug-here 或 英文URL建议：slug-here
    if (!slug) {
      const urlSectionMatch2 = analysisResult.match(/(?:英文URL|URL)(?:建议)?[:：]\s*([a-z0-9-]{3,50})(?:\s|$|\n)/i);
      if (urlSectionMatch2 && urlSectionMatch2[1]) {
        slug = urlSectionMatch2[1];
        console.log('[提取URL] 通过格式2匹配到:', slug);
      }
    }
    
    // 格式3: 查找任何带引号的slug格式（中文引号、英文引号）
    if (!slug) {
      const urlSectionMatch3 = analysisResult.match(/["""]([a-z0-9-]{3,50})["""]/);
      if (urlSectionMatch3 && urlSectionMatch3[1]) {
        slug = urlSectionMatch3[1];
        console.log('[提取URL] 通过格式3匹配到:', slug);
      }
    }
    
    // 格式4: 查找类似 "slug-here" 或 slug-here 的格式（在URL相关行中）
    if (!slug) {
      const lines = analysisResult.split('\n');
      for (const line of lines) {
        if (/URL|url|链接|slug/i.test(line)) {
          const match = line.match(/([a-z0-9-]{3,50})/);
          if (match && match[1]) {
            slug = match[1];
            console.log('[提取URL] 通过格式4匹配到:', slug);
            break;
          }
        }
      }
    }
    
    // 格式5: 直接查找符合slug格式的字符串（作为最后备选）
    if (!slug) {
      const slugMatch = analysisResult.match(/\b([a-z0-9]+(?:-[a-z0-9]+){2,})\b/);
      if (slugMatch && slugMatch[1]) {
        slug = slugMatch[1];
        console.log('[提取URL] 通过格式5匹配到:', slug);
      }
    }
    
    if (!slug) {
      console.error('[提取URL] 无法从分析结果中提取URL');
      setError('无法从AI分析结果中提取URL，请检查分析结果格式');
      return;
    }
    
    // 提取标签
    const potentialTags: string[] = [];
    
    // 1. 查找 #开头的标签
    const hashTags = analysisResult.match(/#([a-zA-Z0-9\u4e00-\u9fa5]+)/g);
    if (hashTags) {
      hashTags.forEach(tag => {
        const clean = tag.replace(/^#/, '').trim();
        if (clean && !potentialTags.includes(clean) && clean.length < 20) {
          potentialTags.push(clean);
        }
      });
    }
    
    // 2. 查找标签关键词部分的列表项（支持多种格式）
    const keywordPatterns = [
      /(?:标签关键词|标签|关键词|适用场景|场景)[:：]?\s*\n([\s\S]+?)(?:\n\n|\n---|\n###|$)/i,
      /(?:标签|关键词)[:：]?\s*([^\n]+)/i
    ];
    
    for (const pattern of keywordPatterns) {
      const keywordSection = analysisResult.match(pattern);
      if (keywordSection && keywordSection[1]) {
        const keywordText = keywordSection[1];
        // 匹配列表项：- item, • item, * item, 1. item 等
        const listItems = keywordText.match(/(?:^|\n)[-•*•\d+\.]\s*(?:#)?([^\n,，]+)/g);
        
        if (listItems) {
          listItems.forEach(item => {
            const clean = item
              .replace(/^[-•*•\d+\.]\s*/, '') // 移除列表符号
              .replace(/^#\s*/, '')     // 移除#号
              .replace(/[,，]$/, '')     // 移除末尾逗号
              .trim();
            
            if (clean && !potentialTags.includes(clean) && clean.length < 20 && !clean.includes('*')) {
              potentialTags.push(clean);
            }
          });
        } else {
          // 如果没有列表格式，尝试提取逗号分隔的内容
          const commaSeparated = keywordText.split(/[,，、]/);
          commaSeparated.forEach(item => {
            const clean = item.trim();
            if (clean && !potentialTags.includes(clean) && clean.length < 20) {
              potentialTags.push(clean);
            }
          });
        }
      }
    }
    
    // 3. 如果没有找到标签，使用URL中的单词
    if (potentialTags.length === 0) {
      slug.split('-').forEach(word => {
        if (word.length > 2) {
          potentialTags.push(word);
        }
      });
    }
    
    // 清理和限制标签数量
    let selectedTags = potentialTags
      .filter(tag => tag && tag.length > 0 && tag.length < 20)
      .slice(0, 7); // 最多保留7个标签
    
    console.log('[提取URL] 最终提取结果:');
    console.log('  - URL slug:', slug);
    console.log('  - Tags:', selectedTags);
    
    if (slug) {
      onSeoApply(slug, selectedTags);
      setError(''); // 清除之前的错误
    } else {
      setError('无法从AI分析结果中提取URL');
    }
  };
  
  // 提取并应用内容
  const handleExtractAndApplyContent = () => {
    // 首先尝试提取摘要部分
    const summaryMatch = analysisResult.match(/摘要[^\n]*\n([\s\S]+?)(?:\n\n|\n---|\n###|$)/i);
    
    if (summaryMatch && summaryMatch[1]) {
      const summary = summaryMatch[1].trim()
        .replace(/[""]/g, '"')  // 替换中文引号
        .replace(/^\*\*|\*\*$/g, '')  // 移除首尾的**标记
        .trim();
      
      console.log('提取的摘要:', summary);
      onSummaryApply(summary);
      return;
    }
    
    // 如果没有找到摘要，则提取第一个文案
    const contentMatch = analysisResult.match(/文案[^\n]*\n([\s\S]+?)(?:\n\n|\n选项B|\n---|\n###|$)/i);
    
    if (contentMatch && contentMatch[1]) {
      const content = contentMatch[1].trim();
      console.log('提取的文案:', content);
      onPolishApply(content);
      return;
    }
    
    // 如果都没找到，则使用整个分析结果
    onPolishApply(analysisResult);
  };
  
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 标题栏 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <i className="fas fa-robot mr-2 text-primary"></i>
          AI创意助手
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleShowDebug}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <i className="fas fa-bug mr-1"></i>
            {showDebug ? '隐藏调试' : '查看模板'}
          </button>
          <a
            href="/admin/apikeys"
            target="_blank"
            className="text-sm text-primary hover:text-primary-dark"
          >
            <i className="fas fa-cog mr-1"></i>
            配置AI模板
          </a>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          基于标题进行深度创意分析，生成英文URL建议、多风格文案和适用场景列表。
        </p>
        
        {/* 调试信息显示 */}
        {showDebug && (
          <div className="mb-4 border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-80 overflow-y-auto bg-gray-50 dark:bg-zinc-700 text-xs font-mono">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-700 dark:text-gray-300">当前使用的模板:</span>
            </div>
            <pre className="whitespace-pre-wrap break-words text-gray-600 dark:text-gray-400">
              {templateInfo || '加载中...'}
            </pre>
          </div>
        )}
        
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-circle text-red-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
              <button
                className="ml-auto text-red-500 hover:text-red-700"
                onClick={() => setError('')}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}
        
        {/* 分析按钮 */}
        <button
          onClick={handleAnalyzeArticle}
          disabled={isLoading}
          className="mb-4 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isLoading ? (
            <><i className="fas fa-spinner fa-spin mr-2"></i>AI分析中...</>
          ) : (
            <><i className="fas fa-wand-magic-sparkles mr-2"></i>一键AI创意分析</>
          )}
        </button>
        
        {/* 分析结果 */}
        {analysisResult && (
          <>
            <div className="mb-4">
              <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-80 overflow-y-auto bg-gray-50 dark:bg-zinc-700 text-sm markdown-content">
                <div dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\n/g, '<br>') }} />
              </div>
            </div>
            
            {/* 应用按钮 */}
            <div className="flex space-x-3">
              <button
                onClick={handleApplyURL}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <i className="fas fa-link mr-1"></i>应用URL和标签
              </button>
              <button
                onClick={handleExtractAndApplyContent}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <i className="fas fa-file-alt mr-1"></i>导入摘要/文案
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 