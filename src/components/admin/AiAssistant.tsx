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
    // 1. 首先尝试获取"英文URL"部分下方带双引号的内容
    const urlSectionMatch = analysisResult.match(/(?:英文URL|URL)(?:[^"]*?)[""]([a-z0-9-]+)[""]/i);
    
    let slug = '';
    if (urlSectionMatch && urlSectionMatch[1]) {
      slug = urlSectionMatch[1];
    } else {
      // 2. 备选方案：查找任何看起来像URL slug的双引号内容
      const anyUrlMatch = analysisResult.match(/[""]([a-z0-9-]{3,50})[""]/)
      if (anyUrlMatch && anyUrlMatch[1]) {
        slug = anyUrlMatch[1];
      }
    }
    
    if (!slug) {
      setError('无法从AI分析结果中提取URL');
      return;
    }
    
    // 提取标签关键词 - 查找"标签"、"关键词"或"标签关键词"部分
    const keywordsSection = analysisResult.match(/(?:标签关键词|标签|关键词)[^\n]*\n([\s\S]+?)(?:\n\n|\n---|\n###|$)/i);
    
    let keywords: string[] = [];
    if (keywordsSection && keywordsSection[1]) {
      const keywordText = keywordsSection[1].trim();
      
      // 获取所有标签，不论格式，确保清除所有前缀
      const allLines = keywordText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      // 处理每一行，提取纯标签文本
      for (const line of allLines) {
        // 移除所有可能的前缀：- # • * 等
        let cleanTag = line.replace(/^[-•*]\s*/, ''); // 移除列表符号
        cleanTag = cleanTag.replace(/^#\s*/, '');     // 移除#号
        cleanTag = cleanTag.trim();
        
        if (cleanTag) {
          keywords.push(cleanTag);
        }
      }
      
      // 去重
      keywords = Array.from(new Set(keywords));
    }
    
    // 如果没有找到标签，使用URL中的关键词
    if (keywords.length === 0) {
      keywords = slug.split('-');
    }
    
    console.log('提取的URL:', slug);
    console.log('提取的标签:', keywords);
    
    onSeoApply(slug, keywords);
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