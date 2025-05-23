"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { get, del } from "@/lib/api"; // 导入API工具

// 文章类型定义
interface Article {
  _id: string;
  title: string;
  author: {
    _id: string;
    username: string;
  };
  slug: string;
  status: 'published' | 'draft';
  categories: Array<{
    _id: string;
    name: string;
  }>;
  createdAt: string;
  publishedAt?: string;
  coverType?: 'image' | 'gallery' | 'video';
  coverImage?: string;
  coverGallery?: string[];
  coverVideo?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 添加格式化函数
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function ArticlesPage() {
  const [selectedTab, setSelectedTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // 新增状态，用于控制当前视图
  const [currentView, setCurrentView] = useState('list');
  // 新增媒体类型状态
  const [mediaType, setMediaType] = useState('image');
  
  // 加载文章数据
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const params = new URLSearchParams();
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());
        
        if (selectedTab !== 'list') {
          params.append('status', selectedTab);
        }
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        // 使用API工具发起请求 - 修正API路径
        const data = await get(`/api/admin/articles?${params.toString()}`);
        
        setArticles(data.data.articles || []);
        setPagination(data.data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        });
      } catch (err: any) {
        setError(err.message || '获取文章列表失败');
        console.error('获取文章失败:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArticles();
  }, [selectedTab, pagination.page, pagination.limit, searchTerm]);
  
  // 删除文章
  const handleDeleteArticle = async (id: string) => {
    if (confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      try {
        // 使用API工具删除文章 - 修正API路径
        await del(`/api/admin/articles?id=${id}`);
        
        // 刷新文章列表
        setArticles(articles.filter(article => article._id !== id));
        alert('文章已成功删除');
      } catch (err: any) {
        alert(err.message || '删除文章失败');
        console.error('删除文章失败:', err);
      }
    }
  };
  
  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 搜索时重置到第一页
    setPagination({...pagination, page: 1});
  };
  
  // 切换页面
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination({...pagination, page});
  };
  
  return (
    <div className="container mx-auto max-w-5xl">
      {/* 页面标题 */}
      <h1 className="text-xl font-semibold underline underline-offset-8 decoration-wavy mb-4 pb-2">/// 文章管理 ///</h1>
      
      {/* 列表视图 */}
      {currentView === 'list' && (
        <>
          {/* 标签式导航 */}
          <div className="flex space-x-1 mb-6">
            <button 
              onClick={() => setSelectedTab('list')} 
              className={`px-4 py-2 rounded-md text-sm ${selectedTab === 'list' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300'}`}
            >
              全部文章
            </button>
            <button 
              onClick={() => setSelectedTab('published')} 
              className={`px-4 py-2 rounded-md text-sm ${selectedTab === 'published' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300'}`}
            >
              已发布
            </button>
            <button 
              onClick={() => setSelectedTab('draft')} 
              className={`px-4 py-2 rounded-md text-sm ${selectedTab === 'draft' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300'}`}
            >
              草稿箱
            </button>
          </div>
          
          {/* 操作栏 */}
          <div className="flex justify-between items-center mb-4">
            {/* 搜索框 */}
            <form onSubmit={handleSearch} className="w-full max-w-md relative">
              <input 
                type="text" 
                placeholder="搜索文章..." 
                className="w-full text-xs italic pl-10 pr-4 py-4 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"></i>
              <button type="submit" className="hidden">搜索</button>
            </form>
            
            {/* 新增文章按钮 - 修改为链接到新建文章页面 */}
            <Link href="/admin/articles/create">
              <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors inline-flex items-center whitespace-nowrap ml-4">
                <i className="fa-solid fa-plus mr-2"></i>
                <span>新增文章</span>
              </button>
            </Link>
          </div>
          
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {/* 文章列表 */}
          <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-0 overflow-hidden">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">加载中...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">没有找到符合条件的文章</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-zinc-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        标题
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider md:table-cell hidden">
                        分类
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-gray-700 text-sm italic text-gray-500">
                    {articles.map((article) => (
                      <tr 
                        key={article._id} 
                        className="hover:bg-gray-50 dark:hover:bg-zinc-800"
                      >
                        <td className="px-4 py-2">
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {article.coverType && (
                                  <span className="text-xs mr-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300">
                                    {article.coverType === 'gallery' ? '多图/' : 
                                     article.coverType === 'video' ? '视频/' : 
                                     '单图/'}
                                  </span>
                                )}
                                {article.title}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">
                                <i className="fas fa-user"></i> {article.author?.username || '野盐'} 
                                <span className="text-gray-500 ml-1">
                                  {formatDate(article.publishedAt || article.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap md:table-cell hidden">
                          {article.categories?.map((category) => (
                            <span key={category._id} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs mr-1">
                              {category.name}
                            </span>
                          ))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            article.status === 'published' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                          }`}>
                            {article.status === 'published' ? '已发布' : '草稿'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <Link href={`/admin/articles/edit/${article._id}`}>
                              <button className="text-blue-500 hover:text-blue-700">
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>
                            </Link>
                            <button 
                              onClick={() => handleDeleteArticle(article._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                            <Link href={`/article/${article.slug}`} target="_blank">
                              <button className="text-green-500 hover:text-green-700">
                                <i className="fa-solid fa-eye"></i>
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* 分页 */}
          {!isLoading && articles.length > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                显示 {articles.length} 条，共 {pagination.total} 条
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-50"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                {Array.from({length: Math.min(5, pagination.totalPages)}, (_, i) => {
                  // 计算页码，使当前页在中间
                  const pageOffset = Math.min(
                    Math.max(0, pagination.page - 3),
                    Math.max(0, pagination.totalPages - 5)
                  );
                  const pageNum = i + 1 + pageOffset;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        pagination.page === pageNum 
                          ? 'bg-primary text-white' 
                          : 'bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-50"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 