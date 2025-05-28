"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { pinyin } from "pinyin-pro";
import { get, post, uploadFile } from "@/lib/api";
import { convertToApiImageUrl } from "@/lib/utils";
import dynamic from 'next/dynamic';
import toast from "react-hot-toast";
// 导入AI助手组件
import AiAssistant from "@/components/admin/AiAssistant";

// 防抖函数
const debounce = <T extends (...args: any[]) => void>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 生成slug的辅助函数
const generateSlug = (title: string): string => {
  const lowerCaseTitle = title.toLowerCase();
  const processedTitle = lowerCaseTitle
    .replace(/([a-z0-9])([^\u0000-\u007F])/g, "$1 $2")
    .replace(/([^\u0000-\u007F])([a-z0-9])/g, "$1 $2");
  const words = processedTitle.split(/\s+/);
  const processedWords = words.map((word) =>
    /[\u4e00-\u9fa5]/.test(word) ? pinyin(word, { toneType: "none" }) : word
  );
  return processedWords
    .join("-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

interface Category {
  _id: string;
  name: string;
}

interface Media {
  _id: string;
  filePath: string;
  fileType: string;
  fileName: string;
  createdAt: string;
}

// 动态导入组件
const FileUploader = dynamic(() => import('@/components/admin/FileUploader'), { ssr: false });
const SimpleEditor = dynamic(() => import('@/components/admin/SimpleEditor'), { ssr: false });
const TiptapEditor = dynamic(() => import('@/components/admin/TiptapEditor'), { ssr: false });

// 媒体库选择模态框组件
const MediaLibraryModal = ({ isOpen, onClose, onSelect, mediaType }: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string | string[]) => void;
  mediaType: 'image' | 'video' | 'gallery';
}) => {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 18;
  
  // 多选状态 - 仅在gallery模式下使用
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const isMultiSelectMode = mediaType === 'gallery';

  // 检查并打印单个媒体项
  const logMediaItem = (item: Media | any) => {
    console.log('媒体项详情:', {
      id: item._id,
      filePath: item.filePath,
      fileName: item.fileName,
      fileType: item.fileType,
      // 更多项目...
      fullItem: item
    });
  };

  // 重置选择状态
  useEffect(() => {
    setSelectedItems([]);
  }, [isOpen, mediaType]);

  // 尝试不同方法获取媒体URL
  const getMediaUrl = (item: Media | any): string => {
    // 检查是否有直接的URL属性
    if (item.url) return item.url;
    
    // 如果有filePath，尝试转换
    if (item.filePath) {
      // 使用工具函数转换
      const convertedUrl = convertToApiImageUrl(item.filePath);
      console.log('转换后的URL:', convertedUrl, '原路径:', item.filePath);
      return convertedUrl;
    }
    
    // 如果有文件ID，构建基于ID的路径
    if (item._id) {
      return `/uploads/${item._id}`;
    }
    
    // 最后尝试使用直接路径
    if (typeof item === 'string') {
      return convertToApiImageUrl(item);
    }
    
    // 无法获取有效URL
    console.error('无法获取媒体URL:', item);
    return '';
  };

  // 加载媒体库
  const fetchMedia = async (pageNum = 1) => {
    try {
      setLoading(true);
      // 由于可能存在API限制，这里不应用过滤器，尝试加载所有媒体类型
      const url = `/admin/media?limit=${pageSize}&page=${pageNum}`;
      
      console.log('请求媒体库URL:', url);
      const data = await get(url);
      console.log('媒体库数据响应:', data);
      
      // 检查响应格式
      if (!data || typeof data !== 'object') {
        console.error('API响应格式错误:', data);
        return;
      }
      
      let mediaData: any[] = [];
      
      // 尝试各种可能的数据结构
      if (Array.isArray(data)) {
        mediaData = data;
      } else if (data.data && Array.isArray(data.data)) {
        mediaData = data.data;
      } else if (data.items && Array.isArray(data.items)) {
        mediaData = data.items;
      } else if (data.files && Array.isArray(data.files)) {
        mediaData = data.files;
      } else {
        console.error('无法找到有效的媒体数组:', data);
        
        // 尝试从对象中提取数组
        const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          mediaData = possibleArrays[0] as any[];
          console.log('尝试提取到的媒体数组:', mediaData);
        }
      }
      
      // 简单记录前几项
      if (mediaData && mediaData.length > 0) {
        console.log(`找到${mediaData.length}个媒体文件，前3项:`);
        mediaData.slice(0, 3).forEach(logMediaItem);
      }

      // 过滤当前类型需要的媒体(如果需要)
      let filteredData = mediaData;
      if (mediaType === 'video') {
        filteredData = mediaData.filter((item: any) => isVideoFile(item));
      } else if (mediaType === 'image' || mediaType === 'gallery') {
        filteredData = mediaData.filter((item: any) => isImageFile(item));
      }
      
      // 更新状态
      if (pageNum === 1) {
        setMediaItems(filteredData);
      } else {
        setMediaItems(prev => [...prev, ...filteredData]);
      }
      
      setTotalItems(data.total || mediaData.length);
      setHasMore(mediaData.length === pageSize);
      
    } catch (error) {
      console.error("获取媒体库失败:", error);
      toast.error("获取媒体库失败");
    } finally {
      setLoading(false);
    }
  };

  // 初始加载或重新打开时
  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
    setMediaItems([]);
    fetchMedia(1);
  }, [isOpen, mediaType]);

  // 加载更多
  const loadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMedia(nextPage);
  };

  // 判断是否为图片 - 更全面的检查
  const isImageFile = (item: Media | any): boolean => {
    // 如果item是字符串，假设它是文件路径
    if (typeof item === 'string') {
      const ext = item.split('.').pop()?.toLowerCase() || '';
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
    }
    
    // 检查直接的媒体类型标志
    if (item.type === 'image' || item.mediaType === 'image') return true;
    
    // 检查MIME类型
    if (item.mimeType && item.mimeType.startsWith('image/')) return true;
    if (item.fileType && item.fileType.startsWith('image/')) return true;
    
    // 检查文件扩展名
    const filePath = item.filePath || item.path || item.url || '';
    if (filePath) {
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
    }
    
    // 检查文件名
    const fileName = item.fileName || item.name || '';
    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
    }
    
    return false;
  };
  
  // 判断是否为视频
  const isVideoFile = (item: Media | any): boolean => {
    // 如果item是字符串，假设它是文件路径
    if (typeof item === 'string') {
      const ext = item.split('.').pop()?.toLowerCase() || '';
      return ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
    }
    
    // 检查直接的媒体类型标志
    if (item.type === 'video' || item.mediaType === 'video') return true;
    
    // 检查MIME类型
    if (item.mimeType && item.mimeType.startsWith('video/')) return true;
    if (item.fileType && item.fileType.startsWith('video/')) return true;
    
    // 检查文件扩展名
    const filePath = item.filePath || item.path || item.url || '';
    if (filePath) {
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      return ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
    }
    
    // 检查文件名
    const fileName = item.fileName || item.name || '';
    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      return ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
    }
    
    return false;
  };
  
  // 处理媒体项选择
  const handleItemSelect = (item: Media | any) => {
    const filePath = item.filePath || getMediaUrl(item);
    
    if (isMultiSelectMode) {
      // 多选模式 - 切换选择状态
      setSelectedItems(prev => {
        const exists = prev.includes(filePath);
        if (exists) {
          return prev.filter(path => path !== filePath);
        } else {
          return [...prev, filePath];
        }
      });
    } else {
      // 单选模式 - 直接选择并关闭
      console.log('选择媒体:', filePath);
      onSelect(filePath);
      onClose();
    }
  };
  
  // 确认多选
  const confirmSelection = () => {
    if (selectedItems.length > 0) {
      console.log('选择多个媒体:', selectedItems);
      onSelect(selectedItems);
      onClose();
    } else {
      toast.error('请至少选择一项');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b dark:border-zinc-700">
          <div className="flex items-center">
            <h3 className="text-lg font-medium">
              媒体库 {mediaItems.length > 0 ? `(${mediaItems.length}个项目)` : ''}
            </h3>
            {isMultiSelectMode && selectedItems.length > 0 && (
              <span className="ml-3 bg-primary text-white px-2 py-1 rounded-full text-xs">
                已选择 {selectedItems.length} 项
              </span>
            )}
          </div>
          
          <div className="flex items-center">
            {isMultiSelectMode && (
              <button
                onClick={confirmSelection}
                className="mr-3 px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark flex items-center gap-1"
                disabled={selectedItems.length === 0}
              >
                <i className="fas fa-check"></i>
                <span>确认选择</span>
              </button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {mediaItems.length === 0 && !loading ? (
            <div className="text-center p-8 text-gray-500" key="empty-message">
              没有找到媒体文件
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {mediaItems.map((item, index) => {
                const mediaUrl = getMediaUrl(item);
                const isImage = isImageFile(item);
                const filePath = item.filePath || mediaUrl;
                const fileLabel = item.fileName 
                  || (item.filePath && item.filePath.split('/').pop()) 
                  || '未命名';
                  
                const isSelected = isMultiSelectMode && selectedItems.includes(filePath);
                
                return (
                  <div 
                    key={item._id || `media-item-${index}-${Date.now()}`} 
                    className={`cursor-pointer group relative rounded-lg overflow-hidden border dark:border-zinc-700 ${isSelected ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleItemSelect(item)}
                  >
                    {isImage && mediaUrl ? (
                      <img
                        src={mediaUrl}
                        alt={fileLabel}
                        className="w-full h-24 object-cover"
                        loading="lazy"
                        onError={(e) => {
                          console.error('图片加载失败:', mediaUrl);
                          // 提供一个本地占位图选项
                          e.currentTarget.src = '/images/placeholder.png';
                          // 再次失败时显示纯色背景
                          e.currentTarget.onerror = () => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('bg-gray-200');
                          };
                        }}
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-200 dark:bg-zinc-700 flex flex-col items-center justify-center">
                        <i className={`fas fa-${isVideoFile(item) ? 'film' : 'file'} text-2xl text-gray-400 mb-1`}></i>
                        <span className="text-xs text-gray-500">{isVideoFile(item) ? '视频' : '文件'}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center">
                      {isMultiSelectMode ? (
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${isSelected ? 'bg-primary border-primary' : 'border-white bg-black bg-opacity-30'}`}>
                          {isSelected && <i className="fas fa-check text-white"></i>}
                        </div>
                      ) : (
                        <button 
                          className="bg-primary text-white p-2 rounded-full hover:bg-primary-dark opacity-0 group-hover:opacity-100"
                          title="选择此媒体"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}

                      {/* 显示文件名 */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 opacity-0 group-hover:opacity-100 truncate text-center">
                        {fileLabel}
                      </div>
                    </div>
                    
                    {/* 选中标记 - 显示在角落 */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                        <i className="fas fa-check text-xs"></i>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* 加载指示器和加载更多按钮 */}
          <div className="mt-6 text-center">
            {loading && (
              <div className="flex justify-center p-4" key="loading-spinner">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            
            {!loading && hasMore && mediaItems.length > 0 && (
              <button 
                key="load-more-button"
                onClick={loadMore}
                className="px-4 py-2 bg-gray-100 dark:bg-zinc-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-zinc-600"
              >
                加载更多
              </button>
            )}
            
            {mediaItems.length > 0 && (
              <div className="text-sm text-gray-500 mt-2" key="items-count">
                显示 {mediaItems.length} / {totalItems || '未知'} 个项目
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 依据编辑器类型导入内容转换工具
export const convertEditorContent = (content: any, editorType: string) => {
  if (editorType === 'tiptap') {
    // TipTap编辑器内容转化为EditorJS格式
    if (content && content.json) {
      try {
        // 构建一个简单的EditorJS格式，作为兼容转换
        const blocks: any[] = [];
        
        // 解析TipTap内容并转换为EditorJS格式
        // 这里仅示例，实际转换逻辑可能更复杂
        if (content.html) {
          blocks.push({
            type: 'paragraph',
            data: {
              text: content.html
            }
          });
        }
        
        return {
          time: new Date().getTime(),
          blocks: blocks.length > 0 ? blocks : [{ 
            type: 'paragraph', 
            data: { 
              text: content.html || '' 
            } 
          }]
        };
      } catch (error) {
        console.error('转换TipTap内容错误:', error);
        return { time: new Date().getTime(), blocks: [] };
      }
    }
    return { time: new Date().getTime(), blocks: [] };
  }
  
  // 原始EditorJS内容不需要转换
  return content;
};

export default function CreateArticlePage() {
  const router = useRouter();
  // 使用ref存储编辑器数据，避免频繁状态更新
  const editorDataRef = useRef<any>({});
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    status: "published",
    publishedAt: new Date().toISOString().split("T")[0],
    author: "野盐",
    categoryId: "",
    categories: [] as Category[],
    tags: [] as string[],
    featuredImage: "",
    isFeatured: false,
    isSlider: false,
    displayOption: "显示在文章顶部",
    galleryImages: [] as string[],
    videoUrl: "",
    slug: "",
    isCustomSlug: false
  });
  const [mediaType, setMediaType] = useState("image");
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  // 添加编辑器内容状态
  const [editorContent, setEditorContent] = useState("");

  // 加载分类
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // 使用API工具中的get方法代替直接fetch调用
        const data = await get("/admin/categories");
        if (data.data && Array.isArray(data.data)) {
          setAvailableCategories(data.data);
        } else {
          setAvailableCategories([]);
        }
      } catch (error) {
        console.error("获取分类失败:", error);
        // 加载失败时使用测试数据
        setAvailableCategories([
          { _id: "1", name: "测试分类1" },
          { _id: "2", name: "测试分类2" },
          { _id: "3", name: "测试分类3" }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // 自动生成slug
  useEffect(() => {
    if (formData.title && !formData.isCustomSlug) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [formData.title, formData.isCustomSlug]);

  // 统一表单更新处理
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 编辑器内容变化 - 除了存储在ref中，也更新状态用于AI助手
  const handleContentChange = useCallback((data: any) => {
    editorDataRef.current = data;
    
    // 获取纯文本内容用于AI助手
    let plainText = "";
    if (data && data.blocks) {
      plainText = data.blocks
        .map((block: any) => block.data?.text || "")
        .filter(Boolean)
        .join("\n\n");
    }
    setEditorContent(plainText);
  }, []);

  // 处理AI润色结果应用
  const handleApplyPolish = (polishedContent: string) => {
    // 应用到编辑器
    if (window.confirm("是否将润色后的内容应用到编辑器？")) {
      // 获取编辑器实例并设置内容
      const editor = document.querySelector('.ProseMirror');
      if (editor) {
        // 由于编辑器是复杂组件，这里仅作为示例
        // 实际应用中需要根据编辑器的API更新内容
        toast.success("已应用润色内容");
        
        // 更新ref中的数据
        editorDataRef.current = {
          ...editorDataRef.current,
          blocks: [{
            type: "paragraph",
            data: { text: polishedContent }
          }]
        };
      }
    }
  };

  // 处理AI生成的标题应用
  const handleApplyTitle = (title: string) => {
    setFormData(prev => ({ 
      ...prev, 
      title: title,
      isCustomSlug: false // 重置为自动生成slug
    }));
    toast.success("已应用AI生成的标题");
  };

  // 处理AI生成的摘要应用
  const handleApplySummary = (summary: string) => {
    setFormData(prev => ({ ...prev, excerpt: summary }));
    toast.success("已应用AI生成的摘要");
  };

  // 处理AI生成的SEO建议应用
  const handleApplySeo = (slug: string, keywords: string[]) => {
    setFormData(prev => ({ 
      ...prev, 
      slug: slug,
      isCustomSlug: true, // 设置为自定义slug
      tags: Array.from(new Set([...prev.tags, ...keywords])) // 使用Array.from转换Set为数组
    }));
    toast.success("已应用AI生成的SEO建议");
  };

  // 处理从媒体库选择的媒体
  const handleMediaSelect = (path: string | string[]) => {
    if (mediaType === 'image') {
      setFormData({ ...formData, featuredImage: path as string });
    } else if (mediaType === 'video') {
      setFormData({ ...formData, videoUrl: path as string });
    } else if (mediaType === 'gallery') {
      // 处理多图选择 - path可能是数组或单个字符串
      if (Array.isArray(path)) {
        setFormData({ ...formData, galleryImages: [...formData.galleryImages, ...path] });
      } else {
        setFormData({ ...formData, galleryImages: [...formData.galleryImages, path] });
      }
    }
    setShowMediaLibrary(false);
    toast.success(mediaType === 'gallery' && Array.isArray(path) 
      ? `已添加${path.length}张图片` 
      : '已选择媒体');
  };

  // 媒体上传相关处理函数
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('bg-primary', 'bg-opacity-10');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('bg-primary', 'bg-opacity-10');
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('bg-primary', 'bg-opacity-10');
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    // 检查是否接受当前文件类型
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (mediaType === 'video' && !file.type.startsWith('video/')) {
        toast.error('请上传视频文件');
        return;
      }
      if ((mediaType === 'image' || mediaType === 'gallery') && !file.type.startsWith('image/')) {
        toast.error('请上传图片文件');
        return;
      }
    }
    
    try {
      // 创建FormData并上传
      for (let i = 0; i < files.length; i++) {
        const fileFormData = new FormData();
        fileFormData.append('file', files[i]);
        fileFormData.append('type', 'media');
        
        const result = await uploadFile('/api/admin/upload', fileFormData);
        
        if (result.success) {
          if (mediaType === 'image' && i === 0) {
            setFormData(prevData => ({ ...prevData, featuredImage: result.filePath }));
          } else if (mediaType === 'video' && i === 0) {
            setFormData(prevData => ({ ...prevData, videoUrl: result.filePath }));
          } else if (mediaType === 'gallery') {
            setFormData(prevData => ({ 
              ...prevData, 
              galleryImages: [...prevData.galleryImages, result.filePath] 
            }));
          }
        }
      }
      
      toast.success(files.length > 1 ? `成功上传${files.length}个文件` : '上传成功');
    } catch (error) {
      console.error('拖放上传失败:', error);
      toast.error('上传失败，请重试');
    }
  };

  // 保存文章
  const handleSave = async (status: "draft" | "published") => {
    if (!formData.title.trim()) {
      alert("请输入文章标题");
      return;
    }
    setSaving(true);
    try {
      // 保存时从ref获取最新的编辑器数据
      const currentEditorData = editorDataRef.current;
      const apiData = {
        title: formData.title,
        content: JSON.stringify(currentEditorData),
        editorData: currentEditorData,
        summary: formData.excerpt || formData.title,
        status,
        slug: formData.slug || generateSlug(formData.title),
        ...(formData.categoryId && !["1", "2", "3"].includes(formData.categoryId)
          ? { categories: [formData.categoryId] }
          : { categories: [] }),
        tags: formData.tags,
        coverType: mediaType,
        coverImage: formData.featuredImage || "",
        coverGallery: formData.galleryImages || [],
        coverVideo: formData.videoUrl || "",
        publishedAt: formData.publishedAt,
        isFeatured: formData.isFeatured,
        isSlider: formData.isSlider,
        authorName: formData.author
      };
      
      // 使用API工具中的post方法代替直接fetch调用
      const responseData = await post("/admin/articles", apiData);
      
      alert("文章创建成功");
      router.push("/admin/articles");
    } catch (err: any) {
      alert(err.message || "创建文章失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold underline underline-offset-8 decoration-wavy">
          /// 创建新文章 ///
        </h1>
        <Link
          href="/admin/articles"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          返回列表
        </Link>
      </div>

      {/* 媒体库模态框 */}
      {showMediaLibrary && (
        <MediaLibraryModal
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleMediaSelect}
          mediaType={mediaType as 'image' | 'video' | 'gallery'}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* 标题 */}
          <div>
            <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟文章标题◞</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="输入文章标题"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800"
            />
          </div>

          {/* 自定义Slug */}
          <div className="flex justify-between items-center mt-4 mb-2">
            <label className="block text-sm dark:text-red-700 font-medium">⋙⋙◟文章链接◞</label>
            <label className="inline-flex text-sm items-center">
              <input
                type="checkbox"
                checked={formData.isCustomSlug}
                onChange={(e) => setFormData({ ...formData, isCustomSlug: e.target.checked })}
                className="rounded text-primary mr-2"
              />
              自定义URL
            </label>
          </div>
          <div className="flex w-full">
            <span className="bg-gray-100 dark:bg-zinc-700 px-3 py-2 rounded-l-lg text-text-light">
              /article/
            </span>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              disabled={!formData.isCustomSlug}
              className="flex-1 px-4 py-2 rounded-r-lg bg-gray-100 dark:bg-zinc-800"
            />
          </div>

          {/* 编辑器 */}
          <div className="mb-6">
            <label className="block text-sm dark:text-blue-500 font-medium mt-4 mb-2">⋙⋙◟文章内容◞</label>
            <div className="editor-container" style={{ minHeight: "200px" }}>
              <TiptapEditor
                initialValue=""
                onChange={(content) => {
                  // 转换TipTap内容为EditorJS格式并保存到ref中
                  editorDataRef.current = convertEditorContent(content, 'tiptap');
                  // 提取纯文本用于AI助手
                  try {
                    let plainText = "";
                    if (typeof content === 'object') {
                      plainText = JSON.stringify(content);
                    } else if (typeof content === 'string') {
                      plainText = content;
                    }
                    setEditorContent(plainText);
                  } catch (e) {
                    console.error('提取编辑器内容失败:', e);
                  }
                }}
              />
            </div>
          </div>

          {/* 摘要 */}
          <div className="mt-4">
            <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟文章摘要◞</label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              rows={3}
              placeholder="输入文章摘要"
              className="w-full text-xs italic px-4 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800"
            />
          </div>
          
          {/* AI助手组件 */}
          <div className="mt-6">
            <AiAssistant 
              articleTitle={formData.title}
              articleContent={editorContent}
              onPolishApply={handleApplyPolish}
              onTitleSelect={handleApplyTitle}
              onSummaryApply={handleApplySummary}
              onSeoApply={handleApplySeo}
            />
          </div>
        </div>

        {/* 右侧设置区 */}
        <div className="space-y-6">
            {/* 发布设置 */}
            {/* 媒体上传 */}
            <div className="border-2 border-dotted border-gray-300 dark:border-zinc-900 bg-gray-100 dark:bg-zinc-800 rounded-lg p-4 text-center">
              {/* 类型切换 */}
              <div className="flex space-x-2 mb-4">
                {['image','gallery','video'].map(type => (
                  <button
                    key={type}
                    onClick={() => setMediaType(type)}
                    className={`px-3 py-1 text-sm rounded-md ${mediaType===type?'bg-primary text-white':''}`}
                  >{type==='image'?'单图':type==='gallery'?'多图':'视频'}</button>
                ))}
              </div>
              {/* 预览或上传 */}
              {mediaType==='image' && formData.featuredImage && (<div className="relative mb-2"><img src={convertToApiImageUrl(formData.featuredImage)} alt="Featured" className="w-full h-40 object-cover rounded-lg" /><button onClick={()=>setFormData({...formData,featuredImage:''})} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">×</button></div>)}
              {mediaType==='gallery' && formData.galleryImages.length>0 && (<div className="grid grid-cols-3 gap-2 mb-2">{formData.galleryImages.map((img,idx)=><div key={idx} className="relative group"><img src={convertToApiImageUrl(img)} alt={`图${idx+1}`} className="w-full h-20 object-cover rounded-lg"/><div className="absolute inset-0 bg-black bg-opacity-50 hidden group-hover:flex items-center justify-center"><button onClick={()=>{const arr=[...formData.galleryImages];arr.splice(idx,1);setFormData({...formData,galleryImages:arr});}} className="text-white p-1 rounded-full">×</button></div></div>)}</div>)}
              {mediaType==='video' && formData.videoUrl && (<div className="relative mb-2"><video controls className="w-full h-40 object-cover rounded-lg"><source src={convertToApiImageUrl(formData.videoUrl)} type="video/mp4"/></video><button onClick={()=>setFormData({...formData,videoUrl:''})} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">×</button></div>)}
              {((mediaType==='image'&&!formData.featuredImage)||(mediaType==='gallery'&&formData.galleryImages.length===0)||(mediaType==='video'&&!formData.videoUrl))&&
              <div 
                className="h-40 bg-white dark:bg-zinc-900 rounded-lg flex flex-col items-center justify-center"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <i className={`fas fa-${mediaType==='video'?'video':'image'} text-xl text-gray-400 mb-2`}></i>
                <p className="text-sm text-text-light mb-3">拖放或点击上传</p>
                <div className="flex gap-2">
                  <FileUploader 
                    fileType={mediaType==='gallery'?'多图':mediaType==='video'?'视频':'图片'} 
                    uploadType="media" 
                    accept={mediaType==='video'?'video/*':'image/*'} 
                    multiple={mediaType==='gallery'} 
                    buttonText={`上传${mediaType==='gallery'?'多图':mediaType==='video'?'视频':'图片'}`} 
                    onUploadSuccess={path=>{
                      if(mediaType==='image')setFormData({...formData,featuredImage:path});
                      else if(mediaType==='video')setFormData({...formData,videoUrl:path});
                    }} 
                    onMultipleUploadSuccess={paths=>mediaType==='gallery'&&setFormData({...formData,galleryImages:[...formData.galleryImages,...paths]})} 
                    onUploadError={err=>alert(err.message)}
                  />
                  <button
                    onClick={() => setShowMediaLibrary(true)}
                    className="px-3 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 rounded text-sm flex items-center gap-1"
                  >
                    <i className="fas fa-photo-film"></i>
                    <span>媒体库</span>
                  </button>
                </div>
              </div>}
            </div>
            
            <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4">
              {/* 分类 */}
                <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟分类◞</label>
                {loading ? (
                  <div className="h-10 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div>
                ) : (
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full text-xs italic px-3 py-2 rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200"
                  >
                    <option value="">选择分类</option>
                    {availableCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}

              {/* 标签 */}
              <div className="mt-4">
                <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟标签◞</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, idx) => (
                    <span key={idx} className="bg-primary text-white px-2 py-1 rounded-full text-xs flex items-center">
                      {tag}
                      <button
                        onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== idx) })}
                        className="ml-1"
                      >×</button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' && newTag.trim()) {
                      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
                      setNewTag('');
                      e.preventDefault();
                    }
                  }}
                  placeholder="添加新标签..."
                  className="w-full text-xs italic px-3 py-2 rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200"
                />
              </div>

              {/* 特色文章 */}
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded-full text-primary"
                  />
                  <span className="text-sm ml-2">特色文章</span>
                </label>
                <label className="inline-flex items-center ml-4">
                  <input
                    type="checkbox"
                    checked={formData.isSlider}
                    onChange={(e) => setFormData({ ...formData, isSlider: e.target.checked })}
                    className="rounded-full text-primary"
                  />
                  <span className="text-sm ml-2">通栏轮播</span>
                </label>
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4">
              {/* 文章状态 */}
              <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟状态◞</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full text-xs italic px-3 py-2 rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200 dark:border-0"
              >
                <option value="published">发布</option>
                <option value="draft">草稿</option>
              </select>

              {/* 作者 */}
              <div className="mt-4">
                <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟作者◞</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full text-xs italic px-3 py-2 rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200"
                />
              </div>
              {/* 文章日期 */}
              <div className="mt-4">
                <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟发布日期◞</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    name="publishedAt"
                    value={formData.publishedAt}
                    onChange={handleInputChange}
                    className="w-full text-xs italic px-3 py-2 rounded-lg bg-bg dark:bg-gray-700 border border-gray-200 dark:bg-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, publishedAt: new Date().toISOString().split("T")[0] })}
                    className="px-2 py-1 text-xs bg-primary text-white rounded"
                  >今天</button>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex justify-end space-x-4 pb-6">
              <button onClick={()=>handleSave("draft")} disabled={saving} className="flex-1 md:flex-none px-6 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 transition">
                {saving?"保存中...":"保存为草稿"}
              </button>
              <button onClick={()=>handleSave("published")} disabled={saving} className="flex-1 px-6 py-2 rounded-lg transition-colors border border-primary-light bg-primary text-white hover:bg-primary-dark">
                {saving?"发布中...":"立即发布"}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}
