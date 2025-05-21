"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// import FileUploader from "@/components/admin/FileUploader";
// import SimpleEditor from "@/components/admin/SimpleEditor";
import { pinyin } from "pinyin-pro";
import { get, post, uploadFile } from "@/lib/api"; // 导入API工具
import { convertToApiImageUrl } from "@/lib/utils"; // 添加导入
import dynamic from 'next/dynamic'; // <-- 添加这行导入 dynamic
const FileUploader = dynamic(() => import('@/components/admin/FileUploader'), { ssr: false });
const SimpleEditor = dynamic(() => import('@/components/admin/SimpleEditor'), { ssr: false });

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

  // 编辑器内容变化 - 只存储在ref中，不触发重渲染
  const handleContentChange = useCallback((data: any) => {
    editorDataRef.current = data;
  }, []);

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
    <div className="container mx-auto max-w-5xl">
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
                    className="w-full text-xs italic px-3 py-2 rounded-lg bg-bg dark:bg-zinc-900 border border-gray-200"
                  />
                </div>

                <div className="mt-4">
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
