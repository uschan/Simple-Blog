"use client";

import { useState, useEffect } from "react";

// 为Chart.js添加类型声明
declare global {
  interface Window {
    Chart: any;
  }
}

// 定义数据类型
interface Stats {
  totalVisits: number;
  visitGrowth: number;
  activeUsers: number;
  userGrowth: number;
  pageViews: number;
  viewGrowth: number;
  bounceRate: number;
  bounceChange: number;
}

interface PopularPost {
  title: string;
  views: number;
  comments: number;
  growth: number;
}

interface VisitorLocation {
  country: string;
  visitors: number;
  percentage: number;
}

interface VisitsTrend {
  labels: string[];
  data: number[];
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7days');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 数据状态
  const [stats, setStats] = useState<Stats>({
    totalVisits: 0,
    visitGrowth: 0,
    activeUsers: 0,
    userGrowth: 0,
    pageViews: 0,
    viewGrowth: 0,
    bounceRate: 0,
    bounceChange: 0
  });
  
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([]);
  const [visitorLocations, setVisitorLocations] = useState<VisitorLocation[]>([]);
  const [visitsTrend, setVisitsTrend] = useState<VisitsTrend>({
    labels: [],
    data: []
  });

  // 加载数据
  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/admin/analytics?range=${dateRange}`);
      
      if (!response.ok) {
        throw new Error('获取统计数据失败');
      }
      
      const data = await response.json();
      
      // 更新状态
      setStats(data.data.stats || {
        totalVisits: 0,
        visitGrowth: 0,
        activeUsers: 0,
        userGrowth: 0,
        pageViews: 0,
        viewGrowth: 0,
        bounceRate: 0,
        bounceChange: 0
      });
      
      setPopularPosts(data.data.popularPosts || []);
      setVisitorLocations(data.data.visitorLocations || []);
      setVisitsTrend(data.data.visitsTrend || { labels: [], data: [] });
      
    } catch (err: any) {
      setError(err.message || '获取统计数据失败');
      console.error('获取统计数据失败:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 引入Chart.js脚本并在数据加载后初始化图表
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.async = true;
    document.body.appendChild(script);
    
    script.onload = () => {
      if (!isLoading && !error && visitsTrend.labels.length > 0) {
        setupCharts();
      }
    };
    
    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, [isLoading, error, visitsTrend]);
  
  // 当数据加载完成时，更新图表
  useEffect(() => {
    if (!isLoading && !error && visitsTrend.labels.length > 0 && typeof window !== 'undefined' && window.Chart) {
      setupCharts();
    }
  }, [isLoading, error, visitsTrend]);
  
  const setupCharts = () => {
    if (typeof window !== 'undefined' && window.Chart) {
      // 检查是否已有图表实例，如有则销毁
      const chartInstance = window.Chart.getChart('visitsChart');
      if (chartInstance) {
        chartInstance.destroy();
      }
      
      const canvas = document.getElementById('visitsChart') as HTMLCanvasElement;
      if (canvas) {
        const visitsCtx = canvas.getContext('2d');
        if (visitsCtx) {
          new window.Chart(visitsCtx, {
            type: 'line',
            data: {
              labels: visitsTrend.labels,
              datasets: [{
                label: '访问量',
                data: visitsTrend.data,
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: { grid: { display: false } }
              }
            }
          });
        }
      }
    }
  };
  
  return (
    <div>
      {/* 页面标题 */}
      <h1 className="text-xl font-semibold underline underline-offset-8 decoration-wavy mb-4 pb-2">/// 数据统计 ///</h1>
      
      {/* 日期范围选择 */}
      <div className="flex space-x-1 mb-6">
        <button 
          onClick={() => setDateRange('7days')} 
          className={`px-4 py-2 rounded-md text-sm ${dateRange === '7days' ? 'bg-primary text-white' : ''}`}
        >
          最近7天
        </button>
        <button 
          onClick={() => setDateRange('30days')} 
          className={`px-4 py-2 rounded-md text-sm ${dateRange === '30days' ? 'bg-primary text-white' : ''}`}
        >
          最近30天
        </button>
        <button 
          onClick={() => setDateRange('90days')} 
          className={`px-4 py-2 rounded-md text-sm ${dateRange === '90days' ? 'bg-primary text-white' : ''}`}
        >
          最近90天
        </button>
        <button 
          onClick={() => setDateRange('custom')} 
          className={`px-4 py-2 rounded-md text-sm ${dateRange === 'custom' ? 'bg-primary text-white' : ''}`}
        >
          自定义
        </button>
      </div>
      
      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
          <i className="fas fa-exclamation-triangle mr-2"></i> {error}
          <button 
            onClick={fetchAnalyticsData} 
            className="ml-4 text-sm underline"
          >
            重试
          </button>
        </div>
      )}
      
      {/* 加载状态 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-text-light">正在加载数据统计...</p>
        </div>
      ) : (
        <>
          {/* 数据概览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* 访问量卡片 */}
            <div className="p-4 bg-bg-card rounded-lg shadow-sm stat-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-text-light">总访问量</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.totalVisits.toLocaleString()}</h3>
                  <div className="flex items-center mt-1">
                    <span className={`text-sm font-medium flex items-center ${stats.visitGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      <i className={`fas text-xs mr-1 ${stats.visitGrowth >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                      <span>{Math.abs(stats.visitGrowth)}%</span>
                    </span>
                    <span className="text-text-light text-xs ml-1">较上期</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-500 dark:text-indigo-300">
                  <i className="fas fa-eye"></i>
                </div>
              </div>
            </div>
            
            
            {/* 页面浏览卡片 */}
            <div className="p-4 bg-bg-card rounded-lg shadow-sm stat-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-text-light">页面浏览</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.pageViews.toLocaleString()}</h3>
                  <div className="flex items-center mt-1">
                    <span className={`text-sm font-medium flex items-center ${stats.viewGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      <i className={`fas text-xs mr-1 ${stats.viewGrowth >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                      <span>{Math.abs(stats.viewGrowth)}%</span>
                    </span>
                    <span className="text-text-light text-xs ml-1">较上期</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500 dark:text-blue-300">
                  <i className="fas fa-file-alt"></i>
                </div>
              </div>
            </div>
            
            {/* 跳出率卡片 */}
            <div className="p-4 bg-bg-card rounded-lg shadow-sm stat-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-text-light">跳出率</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.bounceRate}%</h3>
                  <div className="flex items-center mt-1">
                    <span className={`text-sm font-medium flex items-center ${stats.bounceChange <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      <i className={`fas text-xs mr-1 ${stats.bounceChange <= 0 ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                      <span>{Math.abs(stats.bounceChange)}%</span>
                    </span>
                    <span className="text-text-light text-xs ml-1">较上期</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center text-yellow-500 dark:text-yellow-300">
                  <i className="fas fa-sign-out-alt"></i>
                </div>
              </div>
            </div>
          </div>
          
          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* 访问趋势图 */}
            <div className="lg:col-span-2 bg-bg-card rounded-lg shadow-sm p-4">
              <h3 className="block text-sm text-gray-400 dark:text-blue-500 font-medium mb-2">⋙⋙◜访问趋势◝</h3>
              <div className="h-64">
                <canvas id="visitsChart"></canvas>
              </div>
            </div>
            
            {/* 热门文章表格 */}
            <div className="bg-bg-card rounded-lg shadow-sm p-4">
              <h3 className="block text-sm text-gray-400 dark:text-blue-500 font-medium mb-2">⋙⋙◜热门文章◝</h3>
              {popularPosts.length === 0 ? (
                <div className="text-center py-8 text-text-light">
                  暂无数据
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                          文章标题
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                          浏览量
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {popularPosts.map((post, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium">{post.title}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm">{post.views.toLocaleString()}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          {/* 访客地区 */}
          <div className="bg-bg-card rounded-lg shadow-sm p-4 mb-6">
            <h3 className="block text-sm text-gray-400 dark:text-blue-500 font-medium mb-2">⋙⋙◜访客地区分布◝</h3>
            {visitorLocations.length === 0 ? (
              <div className="text-center py-8 text-text-light">
                暂无数据
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                        国家/地区
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                        访客数
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                        占比
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                        分布
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {visitorLocations.map((location, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium">{location.country}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">{location.visitors.toLocaleString()}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">{location.percentage}%</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-full progress-bar">
                            <div className="progress-value" style={{width: `${location.percentage}%`}}></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 