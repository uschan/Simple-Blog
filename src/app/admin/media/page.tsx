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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 媒体数据和分页
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 31, // 增大一页显示的数量
    total: 0,
    totalPages: 0
  });
  
  // 批量选择功能
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 获取媒体文件 - 简化版
  const fetchMedia = useCallback(async (page = 1, limit = 31) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await get(`/api/admin/media?page=${page}&limit=${limit}`);
      
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
  
  // 初始加载
  useEffect(() => {
    fetchMedia(pagination.page, pagination.limit);
  }, [fetchMedia, pagination.page, pagination.limit]);
  
  // 删除文件 - 使用安全更新顺序
  const deleteFile = useCallback(async (fileId: string, e?: React.MouseEvent) => {
    // 防止事件冒泡
    if (e) {
      e.stopPropagation();
    }
    
    if (!confirm('确定要删除这个文件吗？')) {
      return;
    }
    
      try {
        const data = await del('/api/admin/media', {
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: fileId })
        });
        
        if (data.success) {
        // 安全地按顺序更新状态
        // 1. 先从选择列表中移除
        setSelectedItems(prev => prev.filter(id => id !== fileId));
        
        // 2. 延迟一帧后更新媒体列表，确保DOM更新有序进行
        requestAnimationFrame(() => {
          setMediaItems(prev => prev.filter(item => item.id !== fileId));
        });
        } else {
          alert(data.message || '删除文件失败');
        }
      } catch (error) {
        console.error('删除文件失败:', error);
        alert('删除文件失败，请稍后重试');
      }
  }, []);
  
  // 简化全选/取消全选逻辑
  const toggleSelectAll = useCallback((e?: React.MouseEvent) => {
    // 阻止事件冒泡
    if (e) {
      e.stopPropagation();
    }
    
    // 使用函数式更新
    setSelectedItems(prev => 
      prev.length === mediaItems.length ? [] : mediaItems.map(item => item.id)
    );
  }, [mediaItems]);

  // 简化单个选择逻辑
  const toggleSelectItem = useCallback((id: string, event?: React.MouseEvent) => {
    // 如果有事件，阻止事件冒泡，防止父元素的点击事件被触发
    if (event) {
      event.stopPropagation();
    }
    
    // 使用函数式更新来确保状态更新的一致性
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  }, []);
  
  // 批量删除处理函数 - 增加防御性检查
  const handleBulkDelete = useCallback(async (e?: React.MouseEvent) => {
    // 阻止事件冒泡
    if (e) {
      e.stopPropagation();
    }
    
    if (selectedItems.length === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedItems.length} 个文件吗？此操作不可撤销。`)) {
      return;
    }
    
    // 先设置删除中状态
    setIsDeleting(true);
    
    try {
      const data = await del('/api/admin/media/bulk', {
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedItems })
      });
      
      if (data.success) {
        // 先清空选择
        setSelectedItems([]);
        
        // 再更新媒体列表
        setMediaItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
      } else {
        alert(data.message || '批量删除文件失败');
      }
    } catch (error) {
      console.error('批量删除文件失败:', error);
      alert('批量删除文件失败，请稍后重试');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedItems]);
  
  // 处理上传文件
  const uploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadedItems: MediaItem[] = [];
      const total = files.length;
      
      // 针对多文件上传逐个处理
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 创建表单数据
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'media'); // 指定为媒体库上传
        
        // 更新进度
        setUploadProgress(Math.round((i / total) * 90)); 
        
        try {
          const data = await uploadFile('/api/admin/upload', formData);
          
          if (data.success && data.data) {
            uploadedItems.push(data.data);
          }
        } catch (error) {
          console.error(`文件 ${file.name} 上传失败:`, error);
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
          fetchMedia(pagination.page, pagination.limit);
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
  
  // 媒体项组件 - 单独提取以避免重复渲染和事件冒泡问题
  const MediaItem = useCallback(({ item }: { item: MediaItem }) => {
    const isSelected = selectedItems.includes(item.id);
    
    // 处理整个项目的点击
    const handleItemClick = (e: React.MouseEvent) => {
      // 阻止事件冒泡
      e.stopPropagation();
      toggleSelectItem(item.id);
    };
    
    return (
      <div 
        key={item.id} 
        className={`media-card relative ${isSelected ? 'ring-4 ring-primary ring-opacity-70' : ''}`}
        onClick={handleItemClick}
      >
        {/* 选择指示器 */}
        <div className={`absolute top-2 left-2 z-20 w-6 h-6 rounded-full flex items-center justify-center
          ${isSelected 
            ? 'bg-primary text-white' 
            : 'bg-white bg-opacity-70 border border-gray-300'}`}
        >
          {isSelected && <i className="fas fa-check text-xs"></i>}
        </div>
        
        {/* 媒体内容 */}
        {item.type === 'video' ? (
          <video 
            src={convertToApiImageUrl(item.url)}
            className="object-cover w-full h-full"
            preload="metadata"
            controls
          />
        ) : (
          <Image 
            src={convertToApiImageUrl(item.url)} 
            alt={item.name} 
            width={120} 
            height={120} 
            className="object-cover w-full h-full" 
          />
        )}
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
      </div>
    );
  }, [selectedItems, toggleSelectItem]);

  // 打开上传模态框
  const openUploadModal = useCallback((e?: React.MouseEvent) => {
    // 防止事件冒泡
    if (e) {
      e.stopPropagation();
    }
    setShowUploadModal(true);
  }, []);
  
  // 关闭上传模态框
  const closeUploadModal = useCallback((e?: React.MouseEvent) => {
    // 防止事件冒泡
    if (e) {
      e.stopPropagation();
    }
    if (!isUploading) {
      setShowUploadModal(false);
    }
  }, [isUploading]);
  
  // 添加拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  
  // 处理拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isUploading) return;
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // 创建一个新的FormData
    const formData = new FormData();
    
    // 添加所有文件
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
      formData.append('type', 'media'); // 指定为媒体库上传
    }
    
    // 异步上传文件
    (async () => {
      try {
        const uploadedItems: MediaItem[] = [];
        const total = files.length;
        
        // 针对多文件上传逐个处理
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // 创建表单数据
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'media'); // 指定为媒体库上传
          
          // 更新进度
          setUploadProgress(Math.round((i / total) * 90)); 
          
          try {
            const data = await uploadFile('/api/admin/upload', formData);
            
            if (data.success && data.data) {
              uploadedItems.push(data.data);
            }
          } catch (error) {
            console.error(`文件 ${file.name} 上传失败:`, error);
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
            fetchMedia(pagination.page, pagination.limit);
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
    })();
  }, [fetchMedia, isUploading, pagination.limit, pagination.page]);
  
  // 上传卡片组件
  const UploadCard = useCallback(() => (
    <div 
      onClick={openUploadModal} 
      className="media-card border-dashed flex flex-col items-center justify-center cursor-pointer"
    >
      <div className="text-5xl text-gray-300 mb-2">
        <i className="fas fa-plus"></i>
      </div>
      <div className="text-sm text-text-light">上传媒体</div>
    </div>
  ), [openUploadModal]);
  
  return (
    <div className="container mx-auto max-w-6xl">
      {/* 页面标题和操作栏 */}
      <h1 className="text-xl font-semibold underline underline-offset-8 decoration-wavy mb-4">/// 媒体素材库 ///</h1>

      <div className="flex justify-between items-center mb-4">      
          <span className="text-sm text-text-light">共 {pagination.total} 个文件</span>          
          {mediaItems.length > 0 && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleSelectAll}
                className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <i className={`fas ${selectedItems.length === mediaItems.length ? 'fa-square-check text-primary' : 'fa-square'} mr-1`}></i>
                {selectedItems.length === mediaItems.length ? '取消全选' : '全选'}
              </button>
              
              {selectedItems.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="flex items-center px-3 py-1 border border-red-300 rounded-md text-sm text-red-500"
                >
                  {isDeleting ? (
                    <><i className="fas fa-spinner fa-spin mr-1"></i> 删除中</>
                  ) : (
                    <><i className="fas fa-trash-can mr-1"></i> 删除选中({selectedItems.length})</>
                  )}
                </button>
              )}
            </div>
          )}
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
        <div className="bg-bg-card rounded-lg p-8 text-center border-2 border-dashed">
          <div className="text-5xl text-gray-300 mb-4">
            <i className="fas fa-photo-film"></i>
          </div>
          <p className="text-text-light mb-4">媒体库中还没有文件</p>
          <button 
            onClick={() => setShowUploadModal(true)} 
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            上传第一个文件
          </button>
        </div>
      )}
      
      {/* 网格视图 - 唯一保留的视图 */}
      {!isLoading && !error && mediaItems.length > 0 && (
        <div className="media-grid">
          {/* 上传卡片 - 放在最前面 */}
          <UploadCard />
          
          {/* 使用 MediaItem 组件渲染每个媒体项 */}
          {mediaItems.map(item => (
            <MediaItem key={item.id} item={item} />
          ))}
        </div>
      )}
      
      {/* 简化分页 */}
      {!isLoading && !error && mediaItems.length > 0 && pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center">
        <div className="flex space-x-1">
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
                      : 'bg-bg-card border border-gray-200 text-text-light'
                  }`}
                >
                  {pageNum}
          </button>
              );
            })}
        </div>
      </div>
      )}
      
      {/* 上传模态框 */}
      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="modal-backdrop" onClick={closeUploadModal}></div>
          
          <div className="modal-content z-50 p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="text-xl font-bold">上传媒体</h3>
              <button 
                onClick={closeUploadModal} 
                className="text-text-light hover:text-primary"
                disabled={isUploading}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="mb-6">
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  isDragging ? 'bg-primary bg-opacity-10 border-primary' : 
                  !isUploading ? 'bg-gray-50' : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {!isUploading ? (
                  <div>
                    <div className="text-4xl text-gray-300 mb-4">
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
                      className="px-4 py-2 bg-primary text-white rounded-lg cursor-pointer inline-block"
                    >
                      选择文件
                    </label>
                    <p className="text-xs text-text-light mt-3">可选择多个文件</p>
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
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div className="bg-primary h-2.5 rounded-full" style={{width: `${uploadProgress}%`}}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 