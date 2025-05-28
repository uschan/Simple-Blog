"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { get, del } from "@/lib/api"; // 导入API工具

// 文章类型定义
interface Article {
  _id: string;
  title: string;
  author?: {
    _id: string;
    username: string;
  };
  authorName?: string; // 添加作者名称字段
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
    limit: 20, // 增加每页显示数量
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // 新增状态，用于控制当前视图
  const [currentView, setCurrentView] = useState('list');
  // 新增媒体类型状态
  const [mediaType, setMediaType] = useState('image');
  
  // 加载文章数据
  const fetchArticles = async (search: string = searchTerm, page: number = pagination.page) => {
    setIsLoading(true);
    setError('');
    
    try {
      // 创建查询参数
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());
      
      if (selectedTab !== 'list') {
        params.append('status', selectedTab);
      }
      
      // 添加搜索条件 - 仅使用search参数
      if (search) {
        // 只使用search参数，符合后端API route.ts的实现
        params.append('search', search);
        console.log('搜索关键词:', search);
      }
      
      // 发送请求
      const fullUrl = `/admin/articles?${params.toString()}`;
      console.log('发送请求:', fullUrl);
      
      const response = await get(fullUrl);
      console.log('搜索响应:', response);
      
      // 检查数据结构
      if (!response || !response.data || !Array.isArray(response.data.articles)) {
        throw new Error('API返回数据格式不正确');
      }
      
      // 记录搜索结果
      if (search) {
        console.log(`搜索"${search}"的结果:`, response.data.articles.length);
        response.data.articles.forEach((article: any, index: number) => {
          // 检查标题是否包含搜索词
          const titleContainsSearch = article.title && article.title.toLowerCase().includes(search.toLowerCase());
          console.log(`${index+1}. ${article.title} ${titleContainsSearch ? '✓' : '✗'}`);
        });
      }
      
      setArticles(response.data.articles || []);
      setPagination({
        ...pagination,
        page: page,
        total: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.totalPages || 1
      });
    } catch (err: any) {
      console.error('搜索请求失败:', err);
      setError(`搜索失败: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 初始加载和标签切换时加载数据
  useEffect(() => {
    fetchArticles('', 1);
  }, [selectedTab]);
  
  // 删除文章
  const handleDeleteArticle = async (id: string) => {
    if (confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      try {
        await del(`/admin/articles?id=${id}`);
        
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
    if (!searchTerm.trim()) {
      // 如果搜索词为空，显示全部文章
      clearSearch();
      return;
    }
    
    // 搜索时重置到第一页并立即执行搜索
    fetchArticles(searchTerm.trim(), 1);
  };

  // 清除搜索并显示所有文章
  const clearSearch = () => {
    setSearchTerm('');
    fetchArticles('', 1);
  };
  
  // 切换页面
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchArticles(searchTerm, page);
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
                placeholder="输入关键词搜索文章..." 
                className="w-full text-sm pl-10 pr-16 py-3 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"></i>
              
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex">
                {/* 条件渲染清除按钮 */}
                {searchTerm && (
                  <button 
                    type="button"
                    onClick={clearSearch}
                    className="px-2 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="清除搜索"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
                
                <button 
                  type="submit" 
                  className="px-3 py-1.5 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark"
                >
                  搜索
                </button>
              </div>
            </form>
            
            {/* 新增文章按钮 */}
            <Link href="/admin/articles/create">
              <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors inline-flex items-center whitespace-nowrap ml-4">
                <i className="fa-solid fa-plus mr-2"></i>
                <span>新增文章</span>
              </button>
            </Link>
          </div>
          
          {/* 搜索状态提示 */}
          {searchTerm && (
            <div className="mb-4 text-sm bg-gray-100 dark:bg-zinc-800 px-3 py-2 rounded-md flex items-center justify-between">
              <div>
                <span className="text-gray-700 dark:text-gray-300">
                  搜索 &quot;<span className="font-bold text-primary">{searchTerm}</span>&quot; 
                  的结果：共找到 <span className="font-bold text-primary">{pagination.total}</span> 篇文章
                </span>
                {pagination.total > 0 && (
                  <span className="ml-2 text-gray-500 text-xs">
                    (显示第 {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 篇)
                  </span>
                )}
              </div>
              <button 
                onClick={clearSearch}
                className="text-primary hover:underline text-sm font-medium flex items-center"
              >
                <i className="fas fa-times-circle mr-1"></i>
                清除搜索
              </button>
            </div>
          )}
          
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              <p className="font-medium">{error}</p>
              <p className="text-xs mt-1">请确认搜索关键词是否正确，或联系管理员检查后端搜索功能。</p>
            </div>
          )}
          
          {/* 文章列表 */}
          <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-0 overflow-hidden">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">{searchTerm ? '正在搜索...' : '加载中...'}</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? `没有找到包含 "${searchTerm}" 的文章` : "没有找到符合条件的文章"}
                </p>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="mt-2 text-primary hover:underline"
                  >
                    显示全部文章
                  </button>
                )}
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
                                    {article.coverType === 'gallery' ? '多图' : 
                                     article.coverType === 'video' ? '视频' : 
                                     '单图'}
                                  </span>
                                )}
                                {/* 高亮匹配的关键词，安全处理正则表达式 */}
                                {searchTerm && article.title ? (
                                  <span dangerouslySetInnerHTML={{
                                    __html: article.title.replace(
                                      new RegExp(searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi'),
                                      '<mark class="bg-yellow-200 dark:bg-yellow-800 text-black dark:text-white px-0.5 rounded">$&</mark>'
                                    )
                                  }} />
                                ) : (
                                  article.title
                                )}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">
                                <i className="fas fa-user"></i> {article.author?.username || article.authorName || '野盐'} 
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