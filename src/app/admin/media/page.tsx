"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { get, del, uploadFile } from "@/lib/api"; // 导入API工具
import { convertToApiImageUrl } from "@/lib/utils"; // 添加导入

// 媒体文件类型定义
interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document';
  name: string;
  url: string;
  thumbnailUrl?: string; // 添加缩略图URL
  size: string;
  date: string;
  width: number;
  height: number;
  rawSize?: number;
  mimeType?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function MediaPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 分页和筛选状态
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [fileType, setFileType] = useState<string>('');
  
  // 获取媒体文件
  const fetchMedia = useCallback(async (page = 1, limit = 20, search = '', type = '') => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = `/api/admin/media?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (type) url += `&type=${encodeURIComponent(type)}`;
      
      const data = await get(url);
      
      if (data.success) {
        setMediaItems(data.data);
        setPagination(data.pagination);
      } else {
        throw new Error(data.message || '获取媒体文件失败');
      }
    } catch (error) {
      console.error('获取媒体文件失败:', error);
      setError('获取媒体文件失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // 初始加载和筛选变化时获取数据
  useEffect(() => {
    fetchMedia(pagination.page, pagination.limit, searchTerm, fileType);
  }, [fetchMedia, pagination.page, pagination.limit, searchTerm, fileType]);
  
  // 关闭所有模态框
  const closeAllModals = () => {
    setShowUploadModal(false);
    setShowInfoModal(false);
    setSelectedFile(null);
  };
  
  // 打开文件信息模态框
  const openFileInfo = (file: MediaItem) => {
    setSelectedFile({...file});
    setShowInfoModal(true);
  };
  
  // 删除文件
  const deleteFile = async (fileId: string) => {
    if (confirm('确定要删除这个文件吗？')) {
      try {
        // 使用适当的请求方式删除文件
        const data = await del('/api/admin/media', {
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: fileId })
        });
        
        if (data.success) {
          // 更新UI，删除对应文件
          setMediaItems(mediaItems.filter(item => item.id !== fileId));
          
          // 如果当前查看的文件被删除，关闭信息模态框
          if (selectedFile && selectedFile.id === fileId) {
            closeAllModals();
          }
        } else {
          alert(data.message || '删除文件失败');
        }
      } catch (error) {
        console.error('删除文件失败:', error);
        alert('删除文件失败，请稍后重试');
      }
    }
  };
  
  // 处理上传文件
  const uploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadedItems: MediaItem[] = [];
      const failedUploads: { name: string; reason: string }[] = [];
      const total = files.length;
      
      // 针对多文件上传逐个处理
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 创建表单数据
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'media'); // 指定为媒体库上传
        
        // 更新进度 - 为每个文件分配进度空间
        setUploadProgress(Math.round((i / total) * 90)); // 预留10%用于完成处理
        
        // 使用API工具上传文件
        try {
          const data = await uploadFile('/api/admin/upload', formData);
          
          if (data.success && data.data) {
            uploadedItems.push(data.data);
          }
        } catch (error) {
          console.error(`文件 ${file.name} 上传失败:`, error);
          
          // 添加到失败列表
          failedUploads.push({
            name: file.name,
            reason: error instanceof Error ? error.message : '未知错误'
          });
          
          continue; // 继续处理下一个文件
        }
      }
      
      // 全部完成后更新进度到100%
      setUploadProgress(100);
      
      // 如果有成功上传的文件，更新媒体列表
      if (uploadedItems.length > 0) {
        setMediaItems(prev => [...uploadedItems, ...prev]);
        
        // 上传成功后关闭模态框
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          setShowUploadModal(false);
          // 重新获取媒体列表以确保最新数据
          fetchMedia(pagination.page, pagination.limit, searchTerm, fileType);
        }, 500);
      } else {
        // 如果没有文件上传成功
        alert('没有文件上传成功，请重试');
        setIsUploading(false);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('上传文件失败:', error);
      alert('上传失败，请重试');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // 处理页码变更
  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination({ ...pagination, page: newPage });
  };
  
  // 处理搜索提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMedia(1, pagination.limit, searchTerm, fileType);
  };
  
  // 监听ESC键关闭模态框
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  };
  
  return (
    <div onKeyDown={handleKeyDown} tabIndex={-1}>
      {/* 页面标题 */}
      <h1 className="text-xl font-semibold underline underline-offset-8 decoration-wavy mb-4 pb-2">/// 媒体素材库 ///</h1>
      
      {/* 操作栏 */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <div className="text-sm text-text-light">
          共 {pagination.total} 个媒体文件
        </div>
        
        {/* 搜索和过滤 */}
        <div className="flex flex-1 max-w-md">
          <form onSubmit={handleSearch} className="flex w-full">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索文件名..." 
              className="flex-1 px-4 py-2 rounded-l-lg bg-bg-card border border-primary-light focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="px-2 py-2 bg-bg-card border-y border-primary-light focus:outline-none"
            >
              <option value="">所有类型</option>
              <option value="image">图片</option>
              <option value="video">视频</option>
              <option value="document">文档</option>
            </select>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary text-white rounded-r-lg hover:bg-primary-dark transition-colors"
            >
              <i className="fas fa-search"></i>
            </button>
          </form>
        </div>
        
        <div className="flex space-x-2">
          {/* 视图切换 */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : ''}`}
            >
              <i className="fas fa-th-large"></i>
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : ''}`}
            >
              <i className="fas fa-list"></i>
            </button>
          </div>
          
          {/* 上传按钮 */}
          <button 
            onClick={() => setShowUploadModal(true)} 
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors inline-flex items-center"
          >
            <i className="fa-solid fa-upload mr-2"></i>
            <span>上传</span>
          </button>
        </div>
      </div>
      
      {/* 加载和错误状态 */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-3">加载中...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-4">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}
      
      {/* 无数据状态 */}
      {!isLoading && !error && mediaItems.length === 0 && (
        <div className="bg-bg-card rounded-lg p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-5xl text-gray-300 dark:text-gray-600 mb-4">
            <i className="fas fa-photo-film"></i>
          </div>
          <p className="text-text-light mb-4">媒体库中还没有文件</p>
          <button 
            onClick={() => setShowUploadModal(true)} 
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            上传第一个文件
          </button>
        </div>
      )}
      
      {/* 网格视图 */}
      {!isLoading && !error && mediaItems.length > 0 && viewMode === 'grid' && (
        <div className="media-grid">
          {mediaItems.map((item) => (
            <div key={item.id} className="media-card">
              <Image 
                src={convertToApiImageUrl(item.type === 'video' ? (item.thumbnailUrl || '/images/video-placeholder.svg') : item.url)} 
                alt={item.name} 
                width={180} 
                height={180} 
                className="object-cover w-full h-full" 
              />
              <div className="media-overlay">
                <div className="text-white">
                  <div className="font-medium text-sm truncate">{item.name}</div>
                  <div className="text-xs opacity-75">{item.size} · {item.date}</div>
                  {item.type === 'video' && (
                    <div className="text-xs bg-primary-dark px-2 py-0.5 rounded-full inline-block mt-1">
                      <i className="fas fa-video mr-1"></i>视频
                    </div>
                  )}
                </div>
              </div>
              <div className="media-actions">
                <button 
                  onClick={() => openFileInfo(item)} 
                  className="w-8 h-8 rounded-full bg-white bg-opacity-80 text-gray-800 flex items-center justify-center hover:bg-opacity-100"
                >
                  <i className="fas fa-info"></i>
                </button>
                <button 
                  onClick={() => deleteFile(item.id)} 
                  className="w-8 h-8 rounded-full bg-white bg-opacity-80 text-red-500 flex items-center justify-center hover:bg-opacity-100"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
          
          {/* 上传卡片 */}
          <div 
            onClick={() => setShowUploadModal(true)} 
            className="media-card border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="text-5xl text-gray-300 dark:text-gray-600 mb-2">
              <i className="fas fa-plus"></i>
            </div>
            <div className="text-sm text-text-light">上传媒体</div>
          </div>
        </div>
      )}
      
      {/* 列表视图 */}
      {!isLoading && !error && mediaItems.length > 0 && viewMode === 'list' && (
        <div className="bg-bg-card rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider w-12">
                  预览
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                  文件名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                  日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                  大小
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-bg-card">
              {mediaItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <Image 
                        src={convertToApiImageUrl(item.type === 'video' ? (item.thumbnailUrl || '/images/video-placeholder.svg') : item.url)} 
                        alt={item.name} 
                        width={32} 
                        height={32} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-text-light text-xs mt-1">
                          {item.type === 'video' ? (
                            <span className="text-xs text-primary-dark">
                              <i className="fas fa-video mr-1"></i>视频 - {item.width} × {item.height} px
                            </span>
                          ) : (
                            `${item.width} × ${item.height} px`
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openFileInfo(item)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <i className="fa-solid fa-info-circle"></i>
                      </button>
                      <button 
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => {
                          // 直接使用API返回的URL，支持外部存储
                          navigator.clipboard.writeText(item.url);
                          alert('URL已复制到剪贴板');
                        }}
                      >
                        <i className="fa-solid fa-copy"></i>
                      </button>
                      <button 
                        onClick={() => deleteFile(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* 分页 */}
      {!isLoading && !error && mediaItems.length > 0 && (
      <div className="mt-6 flex justify-between items-center">
        <div className="text-text-light text-sm">
            显示 {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} 项，共 {pagination.total} 项
        </div>
        <div className="flex space-x-1">
            <button 
              onClick={() => changePage(pagination.page - 1)} 
              disabled={pagination.page <= 1}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-bg-card border border-gray-200 dark:border-gray-600 text-text-light disabled:opacity-50"
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
                  }`}
                >
                  {pageNum}
          </button>
              );
            })}
            
            <button 
              onClick={() => changePage(pagination.page + 1)} 
              disabled={pagination.page >= pagination.totalPages}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-bg-card border border-gray-200 dark:border-gray-600 text-text-light disabled:opacity-50"
            >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      )}
      
      {/* 上传模态框 */}
      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="modal-backdrop" onClick={() => setShowUploadModal(false)}></div>
          
          <div className="modal-content z-50 p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold">上传媒体</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-text-light hover:text-primary">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="mb-6">
              <div className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center ${!isUploading ? 'bg-gray-50 dark:bg-gray-800' : ''}`}>
                {!isUploading ? (
                  <div>
                    <div className="text-4xl text-gray-300 dark:text-gray-600 mb-4">
                      <i className="fas fa-cloud-upload-alt"></i>
                    </div>
                    <p className="mb-4">拖放文件到此处，或点击选择文件</p>
                    <input 
                      type="file"
                      id="mediaFileUpload"
                      className="hidden"
                      multiple
                      onChange={uploadFiles}
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    />
                    <label 
                      htmlFor="mediaFileUpload" 
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer inline-block"
                    >
                      选择文件
                    </label>
                    <p className="text-xs text-text-light mt-3">可以选择多个文件同时上传</p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 flex items-center justify-center">
                      <i className="fas fa-file-image text-4xl text-primary mr-3"></i>
                      <div className="text-left">
                        <div className="font-medium">上传中</div>
                        <div className="text-sm text-text-light">
                          {uploadProgress < 100 ? `上传中...${uploadProgress}%` : '处理中...'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                      <div className="bg-primary h-2.5 rounded-full" style={{width: `${uploadProgress}%`}}></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-sm text-text-light">
                <p>支持的文件类型：JPG, PNG, GIF, SVG, MP4, PDF</p>
                <p>单个文件最大：20MB</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 文件信息模态框 */}
      {showInfoModal && selectedFile && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="modal-backdrop" onClick={closeAllModals}></div>
          
          <div className="modal-content z-50 p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold">文件信息</h3>
              <button onClick={closeAllModals} className="text-text-light hover:text-primary">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="mb-6 flex flex-col md:flex-row">
              <div className="md:w-1/3 mb-4 md:mb-0 md:mr-4">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {selectedFile.type === 'video' ? (
                    <div className="relative w-full h-full">
                      <Image 
                        src={convertToApiImageUrl(selectedFile.thumbnailUrl || '/images/video-placeholder.svg')} 
                        alt={selectedFile.name} 
                        width={200} 
                        height={200} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button 
                          onClick={() => window.open(selectedFile.url, '_blank')}
                          className="w-12 h-12 rounded-full bg-primary-dark bg-opacity-80 text-white flex items-center justify-center hover:bg-opacity-100"
                        >
                          <i className="fas fa-play"></i>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Image 
                      src={convertToApiImageUrl(selectedFile.url)} 
                      alt={selectedFile.name} 
                      width={200} 
                      height={200} 
                      className="w-full h-full object-cover" 
                    />
                  )}
                </div>
              </div>
              
              <div className="md:w-2/3">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">文件名称</label>
                  <div className="flex">
                    <input 
                      type="text" 
                      value={selectedFile.name}
                      onChange={(e) => setSelectedFile({...selectedFile, name: e.target.value})}
                      className="flex-1 px-4 py-2 rounded-l-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 border border-l-0 border-gray-200 dark:border-gray-700 rounded-r-lg">
                      重命名
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">文件大小</label>
                    <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">{selectedFile.size}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">上传日期</label>
                    <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">{selectedFile.date}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">尺寸</label>
                    <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">{selectedFile.width} × {selectedFile.height} px</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">文件类型</label>
                    <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 capitalize">{selectedFile.type}</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">文件链接</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={selectedFile.url} 
                      readOnly 
                      className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                    />
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary-dark"
                      onClick={() => {
                        // 直接使用API返回的URL，支持外部存储
                        navigator.clipboard.writeText(selectedFile.url);
                        alert('URL已复制到剪贴板');
                      }}
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => {
                  deleteFile(selectedFile.id);
                }}
                className="px-4 py-2 text-red-500 hover:text-red-700 transition-colors flex items-center"
              >
                <i className="fas fa-trash-can mr-1"></i> 删除文件
              </button>
              
              <button 
                onClick={closeAllModals}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 