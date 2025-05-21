"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// import FileUploader from "@/components/admin/FileUploader";
// import SimpleEditor from "@/components/admin/SimpleEditor";
import { pinyin } from "pinyin-pro";
import { get, put, uploadFile } from "@/lib/api"; // 导入API工具
import { convertToApiImageUrl } from "@/lib/utils"; // 添加导入
import dynamic from 'next/dynamic'; // <-- 添加这行导入 dynamic
const FileUploader = dynamic(() => import('@/components/admin/FileUploader'), { ssr: false });
const SimpleEditor = dynamic(() => import('@/components/admin/SimpleEditor'), { ssr: false });

interface Article {
  _id: string;
  title: string;
  content: string;
  editorData?: any;
  excerpt: string;
  summary?: string;
  slug: string;
  status: 'published' | 'draft';
  categories: Array<{
    _id: string;
    name: string;
  }>;
  author: {
    _id: string;
    username: string;
  };
  featuredImage?: string;
  publishedAt?: string;
  createdAt: string;
  tags?: string[];
  coverType?: string;
  coverImage?: string;
  coverGallery?: string[];
  coverVideo?: string;
  displayOption?: string;
  isFeatured?: boolean;
  isSlider?: boolean;
  authorName?: string;
}

// 生成slug的辅助函数
const generateSlug = (title: string): string => {
  // 先处理为小写
  const lowerCaseTitle = title.toLowerCase();
  
  // 预处理：将中文与英文之间添加空格，方便后续分割
  const processedTitle = lowerCaseTitle
    .replace(/([a-z0-9])([^\u0000-\u007F])/g, '$1 $2')  // 在英文后中文前添加空格
    .replace(/([^\u0000-\u007F])([a-z0-9])/g, '$1 $2'); // 在中文后英文前添加空格
  
  // 分割为单词数组
  const words = processedTitle.split(/\s+/);
  
  // 处理每个单词（中文转拼音，英文保持不变）
  const processedWords = words.map(word => {
    // 如果是中文单词
    if (/[\u4e00-\u9fa5]/.test(word)) {
      // 转换为拼音
      return pinyin(word, { toneType: 'none' });
    }
    // 如果是英文或数字，保持不变
    return word;
  });
  
  // 合并并格式化URL，去除特殊字符
  return processedWords.join('-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export default function EditArticlePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 使用ref存储编辑器数据，避免频繁状态更新
  const editorDataRef = useRef<any>({});
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    publishedAt: '',
    author: '',
    categoryId: '',
    categories: [] as Array<{_id: string, name: string}>,
    tags: [] as string[],
    featuredImage: '',
    galleryImages: [] as string[],
    videoUrl: '',
    slug: '',
    isCustomSlug: false,
    isFeatured: false,
    isSlider: false,
    displayOption: '显示在文章顶部'
  });
  const [mediaType, setMediaType] = useState('image');
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');

  // 加载文章数据
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        // 使用API工具中的get方法代替直接fetch调用
        const apiData = await get(`/admin/articles?id=${params.id}`);
        
        // API工具已处理JSON解析和错误检查
        const articleData = apiData.data;
        
        if (!articleData || !articleData._id) {
          throw new Error('文章数据异常或不完整');
        }
        
        // 尝试解析content为Editor.js数据
        let editorData = {};
        try {
          if (articleData.content) {
            editorData = JSON.parse(articleData.content);
          }
        } catch (e) {
          console.warn('无法解析content为Editor.js数据，将使用空对象', e);
          // 如果不是JSON，则创建一个包含原始内容的blocks
          editorData = {
            time: new Date().getTime(),
            blocks: [
              {
                type: 'paragraph',
                data: {
                  text: articleData.content || ''
                }
              }
            ]
          };
        }
        
        // 将编辑器数据存储在ref中
        editorDataRef.current = editorData;
        
        setArticle(articleData);
        setFormData({
          title: articleData.title || '',
          content: articleData.content || '',
          excerpt: articleData.excerpt || '',
          status: articleData.status || 'draft',
          publishedAt: articleData.publishedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          author: articleData.authorName || articleData.author?.username || '野盐',
          categoryId: articleData.categories?.[0]?._id || '',
          categories: articleData.categories || [],
          tags: articleData.tags || [],
          featuredImage: articleData.featuredImage || articleData.coverImage || '',
          galleryImages: articleData.coverGallery || articleData.galleryImages || [],
          videoUrl: articleData.coverVideo || articleData.videoUrl || '',
          isFeatured: articleData.isFeatured || false,
          isSlider: articleData.isSlider || false,
          displayOption: articleData.displayOption || '显示在文章顶部',
          slug: articleData.slug || '',
          isCustomSlug: true // 编辑模式下默认为自定义slug
        });
        
        // 设置媒体类型
        if (articleData.coverType) {
          setMediaType(articleData.coverType); // 直接使用API返回的coverType
        } else if (articleData.galleryImages && articleData.galleryImages.length > 0) {
          setMediaType('gallery');
        } else if (articleData.coverGallery && articleData.coverGallery.length > 0) {
          setMediaType('gallery');
        } else if (articleData.videoUrl || articleData.coverVideo) {
          setMediaType('video');
        } else {
          setMediaType('image');
        }
        
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || '获取文章详情失败');
        setIsLoading(false);
        console.error('获取文章详情失败:', err);
      }
    };
    
    fetchArticle();
  }, [params.id]);

  // 处理表单更新
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 富文本编辑器内容变更处理 - 只存储在ref中，不触发重渲染
  const handleContentChange = useCallback((data: any) => {
    editorDataRef.current = data;
  }, []);

  // 保存文章
  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true);
    try {
      // 保存时从ref获取最新的编辑器数据
      const currentEditorData = editorDataRef.current;
      
      // 使用API工具中的put方法代替直接fetch调用
      const data = await put('/admin/articles', {
        id: params.id,
        title: formData.title,
        content: JSON.stringify(currentEditorData),
        summary: formData.excerpt || formData.title,
        excerpt: formData.excerpt,
        status,
        slug: formData.slug,
        categories: formData.categoryId ? [formData.categoryId] : [],
        tags: formData.tags,
        coverType: mediaType,
        coverImage: mediaType === 'image' ? formData.featuredImage : '',
        featuredImage: formData.featuredImage || "",
        coverGallery: mediaType === 'gallery' ? formData.galleryImages : [],
        coverVideo: mediaType === 'video' ? formData.videoUrl : '',
        publishedAt: formData.publishedAt,
        isFeatured: formData.isFeatured,
        isSlider: formData.isSlider,
        authorName: formData.author
      });
      
      alert('文章保存成功');
      
      if (status === 'published') {
        router.push('/admin/articles');
      }
    } catch (err: any) {
      alert(err.message || '保存文章失败');
      console.error('保存文章失败:', err);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-2">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-5xl">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4">
          <h2 className="text-lg font-medium mb-2">加载文章时出错</h2>
          <p className="mb-2">{error}</p>
          <p className="text-sm text-red-500">文章ID: {params.id}</p>
          <Link href="/admin/articles" className="text-red-600 hover:text-red-700 underline mt-4 inline-block">
            返回文章列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl">
      {/* 返回按钮 */}
      <div className="mb-4">
        <Link href="/admin/articles" className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors inline-flex items-center">
          <i className="fa-solid fa-arrow-left mr-2"></i>
          <span>返回列表</span>
        </Link>
      </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 主要内容区域 */}
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
          <div className="mt-4">
            <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟文章内容◞</label>
            <div className="editor-container" style={{ minHeight: "400px" }}>
              <SimpleEditor 
                initialValue={editorDataRef.current}
                onChange={handleContentChange}
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
          </div>
          
          {/* 右侧设置区 */}
          <div className="space-y-6">
          {/* 发布设置 */}
          <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4">
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

            <div className="mt-4">
              <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟作者◞</label>
                <input 
                  type="text" 
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                placeholder="输入作者名称"
                className="w-full text-xs italic px-3 py-2 rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200"
                />
            </div>

            <div className="mt-4">
              <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◟分类◞</label>
                <select 
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                className="w-full text-xs italic px-3 py-2 rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200"
                >
                  <option value="">选择分类</option>
                {formData.categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                  ))}
                </select>
            </div>
                
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
            {((mediaType==='image'&&!formData.featuredImage)||(mediaType==='gallery'&&formData.galleryImages.length===0)||(mediaType==='video'&&!formData.videoUrl))&&<div className="h-40 bg-white dark:bg-zinc-900 rounded-lg flex flex-col items-center justify-center"><i className={`fas fa-${mediaType==='video'?'video':'image'} text-xl text-gray-400 mb-2`}></i><p className="text-sm text-text-light mb-3">拖放或点击上传</p><FileUploader 
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
              // FileUploader组件内部应已通过API工具实现认证上传
            /></div>}
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