"use client";

import { useState, useEffect } from "react";
import { get, put, del } from "@/lib/api"; // 导入API工具

// 评论类型定义
interface Reply {
  id: string;
  author: {
    name: string;
    email: string;
    website?: string;
  };
  content: string;
  createdAt: string;
  isAdmin?: boolean;
}

interface Comment {
  _id: string;
  content: string;
  author: {
    name: string;
    email: string;
    website?: string;
  };
  articleId: {
    _id: string;
    title: string;
    slug: string;
  };
  parentId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function CommentsPage() {
  const [showReplyArea, setShowReplyArea] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  
  // 加载评论数据
  const fetchComments = async (page = 1, status?: string) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      let url = `/api/admin/comments?page=${page}&limit=${pagination.limit}`;
      if (status) {
        url += `&status=${status}`;
      }
      
      const result = await get(url);
      if (result.data) {
        setComments(result.data.comments);
        setPagination(result.data.pagination);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('获取评论列表失败:', error);
      setErrorMessage(error instanceof Error ? error.message : '获取评论列表失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 初始加载评论
  useEffect(() => {
    fetchComments();
  }, []);
  
  // 切换回复区域
  const toggleReplyArea = (commentId: string) => {
    if (showReplyArea === commentId) {
      setShowReplyArea(null);
    } else {
      setShowReplyArea(commentId);
      setReplyText('');
    }
  };
  
  // 更新评论状态
  const updateCommentStatus = async (commentId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      const result = await put('/api/admin/comments', { 
        id: commentId, 
        status: newStatus 
      });
      
      // 更新本地状态
      setComments(comments.map(comment => 
        comment._id === commentId 
          ? { ...comment, status: newStatus }
          : comment
      ));
      
      // 关闭操作菜单
      setShowActionMenu(null);
    } catch (error) {
      console.error('更新评论状态失败:', error);
      alert(error instanceof Error ? error.message : '更新评论状态失败');
    }
  };
  
  // 提交回复 - 待接入后端API
  const submitReply = async (commentId: string) => {
    if (replyText.trim() === '') return;
    
    alert('回复功能尚未实现，即将添加');
    setShowReplyArea(null);
    setReplyText('');
  };
  
  // 删除评论
  const deleteComment = async (commentId: string) => {
    if (confirm('确定要删除这条评论吗？')) {
      try {
        await del(`/api/admin/comments?id=${commentId}`);
        
        // 从列表中移除该评论
        setComments(comments.filter(comment => comment._id !== commentId));
      } catch (error) {
        console.error('删除评论失败:', error);
        alert(error instanceof Error ? error.message : '删除评论失败');
      }
    }
  };

  // 处理点击外部关闭操作菜单
  const handleClickOutside = () => {
    setShowActionMenu(null);
  };
  
  // 获取评论状态显示文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '已批准';
      case 'pending': return '待审核';
      case 'rejected': return '已拒绝';
      default: return status;
    }
  };
  
  // 获取评论状态CSS类
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };
  
  // 处理页码变更
  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchComments(newPage);
  };
  
  return (
    <div onClick={handleClickOutside} className="container mx-auto max-w-4xl">
      {/* 页面标题 */}
      <h1 className="text-xl font-semibold underline underline-offset-8 decoration-wavy mb-4 pb-2">/// 评论管理 ///</h1>
      
      {/* 全局操作菜单 - 固定定位在页面顶层 */}
      {showActionMenu && (
        <div 
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[9999]"
          style={{ 
            top: menuPosition.top + 'px', 
            left: menuPosition.left + 'px',
            width: '150px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            {comments.find(c => c._id === showActionMenu)?.status !== 'approved' && (
              <button 
                onClick={() => updateCommentStatus(showActionMenu, 'approved')}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <i className="fas fa-check mr-2 text-green-500"></i> 批准
              </button>
            )}
            {comments.find(c => c._id === showActionMenu)?.status !== 'rejected' && (
              <button 
                onClick={() => updateCommentStatus(showActionMenu, 'rejected')}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <i className="fas fa-ban mr-2 text-red-500"></i> 拒绝
              </button>
            )}
            <button 
              onClick={() => {
                toggleReplyArea(showActionMenu);
                setShowActionMenu(null);
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <i className="fas fa-reply mr-2 text-blue-500"></i> 回复
            </button>
            <button 
              onClick={() => {
                deleteComment(showActionMenu);
                setShowActionMenu(null);
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <i className="fas fa-trash mr-2 text-red-500"></i> 删除
            </button>
          </div>
        </div>
      )}
      
      {/* 操作栏 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-text-light">
          共 {pagination.total} 条评论
        </div>
        
        {/* 过滤按钮 */}
        <div className="flex space-x-2">
          <button 
            onClick={() => fetchComments(1)}
            className="px-3 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            全部
          </button>
          <button 
            onClick={() => fetchComments(1, 'pending')}
            className="px-3 py-1 text-sm rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200"
          >
            待审核
          </button>
          <button 
            onClick={() => fetchComments(1, 'approved')}
            className="px-3 py-1 text-sm rounded-lg border border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-900/30 dark:text-green-200"
          >
            已批准
          </button>
          <button 
            onClick={() => fetchComments(1, 'rejected')}
            className="px-3 py-1 text-sm rounded-lg border border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-900/30 dark:text-red-200"
          >
            已拒绝
          </button>
        </div>
      </div>
      
      {/* 加载状态 */}
      {isLoading && (
        <div className="py-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2 text-text-light">加载评论数据...</p>
        </div>
      )}
      
      {/* 错误状态 */}
      {!isLoading && errorMessage && (
        <div className="py-8 text-center">
          <div className="text-red-500">
            <i className="fas fa-exclamation-triangle mr-2"></i>{errorMessage}
          </div>
        </div>
      )}
      
      {/* 没有数据的状态 */}
      {!isLoading && !errorMessage && comments.length === 0 && (
        <div className="py-16 text-center bg-bg-card rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-5xl text-gray-300 dark:text-gray-600 mb-4">
            <i className="fas fa-comments"></i>
          </div>
          <p className="text-text-light mb-2">暂无评论数据</p>
        </div>
      )}
      
      {/* 评论卡片列表 */}
      <div className="space-y-4">
        {!isLoading && comments.map((comment) => (
          <div key={comment._id} className="bg-bg-card rounded-lg shadow-sm overflow-hidden">
            {/* 评论主体 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 comment-item">
              <div className="flex">
                {/* 评论内容 */}
                <div className="flex-1">
                  <div className="flex items-center flex-wrap mb-1">
                    <h3 className="text-md font-medium mr-2">{comment.author.name}</h3>
                    <div className={`comment-status-dot mr-1 ${
                      comment.status === 'approved' 
                        ? 'status-approved' 
                        : comment.status === 'pending' 
                          ? 'status-pending' 
                          : 'status-rejected'
                    }`}></div>
                    <span className={`text-xs py-0.5 px-2 rounded-full ${getStatusClass(comment.status)}`}>
                      {getStatusText(comment.status)}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{comment.content}</p>
                  <div className="flex items-center text-xs text-text-light space-x-4">
                    <span>
                      <i className="fas fa-file-alt mr-1"></i>
                      <span>{comment.articleId?.title || '文章已删除'}</span>
                    </span>
                    <span>
                      <i className="fas fa-clock mr-1"></i>
                      <span>{formatDate(comment.createdAt)}</span>
                    </span>
                  </div>
                </div>
                
                {/* 操作按钮组 */}
                <div className="flex space-x-2 ml-4">
                  <div className="relative">
                    <button 
                      className="p-2 text-text-light hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        // 记录点击位置，用于定位菜单
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuPosition({
                          top: rect.top - 10, // 菜单在按钮上方10px
                          left: rect.right - 150 // 菜单右对齐，宽度约150px
                        });
                        setShowActionMenu(showActionMenu === comment._id ? null : comment._id);
                      }}
                    >
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 回复区域 */}
            {showReplyArea === comment._id && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <textarea 
                    className="w-full p-3 min-h-[100px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
                    placeholder="输入回复内容..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  ></textarea>
                  
                  <div className="flex justify-end mt-2 space-x-2">
                    <button 
                      onClick={() => setShowReplyArea(null)} 
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      取消
                    </button>
                    <button 
                      onClick={() => submitReply(comment._id)} 
                      className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark"
                      disabled={replyText.trim() === ''}
                    >
                      提交回复
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 分页 */}
      {!isLoading && comments.length > 0 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-text-light text-sm">
            显示 {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} 项，共 {pagination.total} 项
          </div>
          <div className="flex space-x-1">
            <button 
              onClick={() => changePage(pagination.page - 1)} 
              disabled={pagination.page <= 1}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-bg-card border border-gray-200 dark:border-gray-600 text-text-light disabled:opacity-50 mobile-touch-target"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => changePage(pageNum)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    pagination.page === pageNum 
                      ? 'bg-primary text-white' 
                      : 'bg-bg-card border border-gray-200 dark:border-gray-600 text-text-light'
                  } mobile-touch-target`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              onClick={() => changePage(pagination.page + 1)} 
              disabled={pagination.page >= pagination.totalPages}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-bg-card border border-gray-200 dark:border-gray-600 text-text-light disabled:opacity-50 mobile-touch-target"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 