'use client';

import { useState, useEffect } from 'react';

interface ViewStats {
  totalViews: number;
  uniqueVisitors: number;
  deviceStats: Array<{
    deviceType: string;
    count: number;
  }>;
  latestView: string | null;
}

interface Article {
  _id: string;
  title: string;
  slug: string;
  viewCount: number;
  publishedAt: string;
}

export default function StatisticsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<string>('');
  const [period, setPeriod] = useState<string>('all');
  const [viewStats, setViewStats] = useState<ViewStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 加载文章列表
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/articles?limit=100');
        
        if (!response.ok) {
          throw new Error('获取文章列表失败');
        }
        
        const data = await response.json();
        
        if (data.data) {
          // 按访问量排序
          const sortedArticles = [...data.data].sort((a, b) => 
            (b.viewCount || 0) - (a.viewCount || 0)
          );
          setArticles(sortedArticles);
          
          // 默认选择访问量最高的文章
          if (sortedArticles.length > 0 && !selectedArticle) {
            setSelectedArticle(sortedArticles[0]._id);
          }
        }
      } catch (err) {
        setError('获取文章列表失败: ' + (err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArticles();
  }, []);
  
  // 获取选定文章的访问统计
  useEffect(() => {
    if (!selectedArticle) return;
    
    const fetchViewStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/views?articleId=${selectedArticle}&period=${period}`);
        
        if (!response.ok) {
          throw new Error('获取访问统计失败');
        }
        
        const data = await response.json();
        
        if (data.success && data.viewStats) {
          setViewStats(data.viewStats);
        } else {
          setError('获取访问统计失败: ' + (data.error || '未知错误'));
        }
      } catch (err) {
        setError('获取访问统计失败: ' + (err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchViewStats();
  }, [selectedArticle, period]);
  
  // 处理文章选择变化
  const handleArticleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedArticle(e.target.value);
  };
  
  // 处理时间段选择变化
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriod(e.target.value);
  };
  
  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '无数据';
    return new Date(dateString).toLocaleString('zh-CN');
  };
  
  // 获取设备类型图表数据
  const getDeviceChartData = () => {
    if (!viewStats || !viewStats.deviceStats) return [];
    
    const colors = {
      desktop: '#4CAF50',
      mobile: '#2196F3',
      tablet: '#FFC107',
      unknown: '#9E9E9E'
    };
    
    return viewStats.deviceStats.map(item => ({
      label: item.deviceType === 'desktop' ? '桌面端' :
             item.deviceType === 'mobile' ? '移动端' :
             item.deviceType === 'tablet' ? '平板' : '未知',
      value: item.count,
      color: colors[item.deviceType as keyof typeof colors] || '#9E9E9E'
    }));
  };
  
  // 获取选中的文章标题
  const getSelectedArticleTitle = () => {
    const article = articles.find(a => a._id === selectedArticle);
    return article ? article.title : '未选择文章';
  };
  
  return (
    <div className="container mx-auto max-w-5xl">
      <h1 className="text-xl font-semibold underline underline-offset-8 decoration-wavy mb-4 pb-2">/// 访问统计总览 ///</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* 单篇文章统计 */}
      <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h2 className="text-lg font-medium mb-4">文章访问统计</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 文章选择器 */}
          <div>
            <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟选择文章◞</label>
            <select
              value={selectedArticle}
              onChange={handleArticleChange}
              className="w-full text-xs italic px-3 py-2 rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200 dark:border-0"
              disabled={isLoading}
            >
              <option value="">请选择文章</option>
              {articles.map(article => (
                <option key={article._id} value={article._id}>
                  {article.title} ({article.viewCount || 0} 次访问)
                </option>
              ))}
            </select>
          </div>
          
          {/* 时间段选择器 */}
          <div>
            <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟时间段◞</label>
            <select
              value={period}
              onChange={handlePeriodChange}
              className="w-full text-xs italic px-3 py-2 rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200 dark:border-0"
              disabled={isLoading}
            >
              <option value="all">全部时间</option>
              <option value="today">今天</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
            </select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
            <span className="ml-3">加载中...</span>
          </div>
        ) : selectedArticle && viewStats ? (
          <div>
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-2">{getSelectedArticleTitle()}</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* 文章访问量 */}
                <div className="bg-blue-50 dark:bg-zinc-900/50 border border-blue-100 dark:border-0 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-blue-800 mb-1">访问量</h4>
                  <p className="text-xl font-bold text-blue-900">{viewStats.totalViews}</p>
                </div>
                
                {/* 独立访客 */}
                <div className="bg-green-50 dark:bg-zinc-900/50 border border-green-100 dark:border-0 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-green-800 mb-1">独立访客</h4>
                  <p className="text-xl font-bold text-green-900">{viewStats.uniqueVisitors}</p>
                </div>
                
                {/* 最近访问 */}
                <div className="bg-purple-50 dark:bg-zinc-900/50 border border-purple-100 dark:border-0 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-purple-800 mb-1">最近访问</h4>
                  <p className="text-sm italic font-medium text-purple-900">
                    {formatDate(viewStats.latestView)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 设备类型分布 */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-4">
              <h3 className="text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟设备类型分布◞</h3>
              <div className="flex flex-wrap gap-4">
                {getDeviceChartData().map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-4 h-4 mr-2 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="mr-1">{item.label}:</span>
                    <span className="font-bold">{item.value}</span>
                    <span className="text-xs ml-1 text-gray-500">
                      ({Math.round(item.value / viewStats.totalViews * 100) || 0}%)
                    </span>
                  </div>
                ))}
              </div>
              
              {/* 简单的柱状图 */}
              <div className="mt-4 h-24 flex items-end space-x-2">
                {getDeviceChartData().map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full rounded-t-sm transition-all duration-500" 
                      style={{ 
                        backgroundColor: item.color,
                        height: `${(item.value / viewStats.totalViews * 100) || 0}%`,
                        minHeight: '4px',
                      }}
                    ></div>
                    <span className="text-xs mt-1">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {selectedArticle ? '没有找到统计数据' : '请选择一篇文章查看统计数据'}
          </div>
        )}
      </div>
      
      {/* 访问量排行 */}
      <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-medium mb-4">访问量排行</h2>
        <div className="overflow-x-auto">
          <table className="text-sm min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left font-medium uppercase tracking-wider">
                  文章标题
                </th>
                <th className="px-4 py-3 text-left font-medium uppercase tracking-wider">
                  发布日期
                </th>
                <th className="px-4 py-3 text-left font-medium uppercase tracking-wider">
                  访问量
                </th>
              </tr>
            </thead>
            <tbody className="text-sm italic text-gray-500 bg-white dark:bg-zinc-900 divide-y divide-gray-200">
              {articles.slice(0, 10).map(article => (
                <tr key={article._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a 
                      href={`/article/${article.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {article.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    {article.viewCount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 