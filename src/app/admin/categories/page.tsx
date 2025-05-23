"use client";

import { useState, useEffect } from "react";
import SimpleFileUploader from "@/components/admin/SimpleFileUploader";
import OptimizedImage from "@/components/shared/OptimizedImage";
import { useRouter } from "next/navigation";
import { ensureRelativePath, convertToApiImageUrl } from "@/lib/utils";
import { get, post, put, del } from "@/lib/api";
import dynamic from 'next/dynamic';

const FileUploader = dynamic(() => import('@/components/admin/FileUploader'), { ssr: false });

// 分类类型定义
interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  image?: string; // 分类图片
  isFeatured?: boolean; // 推荐分类
}

export default function CategoriesPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<Omit<Category, '_id' | 'count' | 'createdAt' | 'updatedAt'>>({
    name: '',
    slug: '',
    description: '',
    order: 0,
    image: '',
    isFeatured: false
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    slug: ''
  });
  
  // 加载分类数据
  useEffect(() => {
    fetchCategories();
  }, []);
  
  const fetchCategories = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 使用API工具而非原生fetch
      const data = await get('/api/admin/categories');
      setCategories(data.data || []);
    } catch (error: any) {
      console.error('获取分类失败:', error);
      setErrorMessage(error.message || '获取分类列表失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 生成slug
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };
  
  // 当名称变化时自动生成slug
  const handleNameChange = (name: string) => {
    setNewCategory(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };
  
  // 处理图片上传成功
  const handleImageUploadSuccess = (imagePath: string) => {
    const path = ensureRelativePath(imagePath);
    setNewCategory({
      ...newCategory,
      image: path
    });
  };
  
  // 表单验证
  const validateForm = () => {
    const errors = {
      name: '',
      slug: ''
    };
    let isValid = true;
    
    if (!newCategory.name.trim()) {
      errors.name = '分类名称不能为空';
      isValid = false;
    }
    
    // 如果没有手动输入slug，则自动生成
    let slug = newCategory.slug.trim();
    if (!slug) {
      slug = generateSlug(newCategory.name);
      setNewCategory({...newCategory, slug});
    }
    
    // 检查slug是否唯一
    const existingCategory = categories.find(cat => 
      cat.slug === slug && cat._id !== (editCategory?._id || '')
    );
    
    if (existingCategory) {
      errors.slug = '此Slug已被使用，请使用其他值';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // 显示编辑模态框
  const showEditModal = (category: Category) => {
    console.log('编辑分类数据:', category);
    setFormErrors({ name: '', slug: '' });
    setEditCategory(category);
    setNewCategory({ 
      name: category.name, 
      slug: category.slug, 
      description: category.description || '',
      order: category.order || 0,
      image: category.image || '',
      isFeatured: category.isFeatured || false
    });
    console.log('设置新分类数据:', {
      name: category.name, 
      slug: category.slug, 
      description: category.description || '',
      order: category.order || 0,
      image: category.image || '',
      isFeatured: !!category.isFeatured
    });
    setShowModal(true);
  };
  
  // 添加新分类
  const addCategory = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    setErrorMessage('');
    
    console.log('新增分类数据:', newCategory);
    
    try {
      // 使用API工具
      const result = await post('/api/admin/categories', newCategory);
      console.log('新增分类返回数据:', result);
      
      // 添加新分类到列表
      setCategories([...categories, result.data]);
      
      // 重置表单
      setNewCategory({ name: '', slug: '', description: '', order: 0, image: '', isFeatured: false });
      setShowModal(false);
      
      // 刷新数据而不是重定向
      fetchCategories();
    } catch (error: any) {
      console.error('保存分类失败:', error);
      setErrorMessage(error.message || '保存分类时出错');
    } finally {
      setIsSaving(false);
    }
  };
  
  // 更新现有分类
  const updateCategory = async () => {
    if (!validateForm() || !editCategory) return;
    
    setIsSaving(true);
    setErrorMessage('');
    
    console.log('更新分类数据:', {
      id: editCategory._id,
      ...newCategory
    });
    
    try {
      // 使用API工具
      const result = await put('/api/admin/categories', {
        id: editCategory._id,
        ...newCategory
      });
      
      console.log('更新分类返回数据:', result);
      
      // 更新列表中的分类
      setCategories(categories.map(cat => 
        cat._id === editCategory._id ? result.data : cat
      ));
      
      // 重置表单并关闭模态框
      setNewCategory({ name: '', slug: '', description: '', order: 0, image: '', isFeatured: false });
      setEditCategory(null);
      setShowModal(false);
      
      // 刷新数据而不是重定向
      fetchCategories();
    } catch (error: any) {
      console.error('更新分类失败:', error);
      setErrorMessage(error.message || '更新分类时出错');
    } finally {
      setIsSaving(false);
    }
  };
  
  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editCategory) {
      updateCategory();
    } else {
      addCategory();
    }
  };
  
  // 删除分类
  const deleteCategory = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？此操作不可撤销。')) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 使用API工具
      await del(`/api/admin/categories?id=${id}`);
      
      // 从列表中移除分类
      setCategories(categories.filter(cat => cat._id !== id));
    } catch (error: any) {
      console.error('删除分类失败:', error);
      setErrorMessage(error.message || '删除分类时出错');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-4xl">
      {/* 页面标题 */}
      <h1 className="text-xl font-semibold underline underline-offset-8 decoration-wavy mb-4 pb-2">/// 分类管理 ///</h1>
      {/* 操作栏 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-text-light text-sm">
          共 {categories.length} 个分类
        </div>
        
        {/* 新增分类按钮 */}
        <button 
          onClick={() => {
            setShowModal(true);
            setEditCategory(null);
            setNewCategory({ name: '', slug: '', description: '', order: 0, image: '', isFeatured: false });
            setFormErrors({ name: '', slug: '' });
          }} 
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors inline-flex items-center"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          <span>新增分类</span>
        </button>
      </div>
      
      <div className="bg-bg-card rounded-lg shadow-sm overflow-hidden">
        {/* 加载状态 */}
        {isLoading && (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-text-light">加载分类数据...</p>
          </div>
        )}
        
        {/* 错误状态 */}
        {!isLoading && errorMessage && (
          <div className="py-8 text-center">
            <div className="text-red-500">
              <i className="fas fa-exclamation-triangle mr-2"></i>{errorMessage}
            </div>
            <button 
              onClick={fetchCategories} 
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <i className="fas fa-redo mr-2"></i>重试
            </button>
          </div>
        )}
        
        {/* 空状态 */}
        {!isLoading && !errorMessage && categories.length === 0 && (
          <div className="py-8 text-center">
            <div className="text-lg font-medium">暂无分类数据</div>
            <p className="mt-2 text-text-light">点击"新增分类"按钮添加第一个分类</p>
          </div>
        )}
        
        {/* 分类表格 */}
        {!isLoading && !errorMessage && categories.length > 0 && (
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-light uppercase tracking-wider">
                  分类名称
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-light uppercase tracking-wider hidden md:table-cell">
                  描述
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-light uppercase tracking-wider">
                  文章数
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-light uppercase tracking-wider">
                  推荐
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-text-light uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-200 dark:divide-gray-700 bg-bg-card">
              {categories.map((category) => (
                <tr key={category._id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{category.name}</div>
                        <div className="text-xs mt-1">
                          <code className="text-gray-500 dark:text-gray-400 italic text-xs">{category.slug}</code>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">{category.description}</td>
                  <td className="px-6 py-4">{category.count || 0}</td>
                  <td className="px-6 py-4">
                    {category.isFeatured ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <i className="fas fa-check-circle mr-1"></i> 是
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => showEditModal(category)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button 
                        onClick={() => deleteCategory(category._id)}
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
        )}
      </div>
      
      {/* 添加/编辑分类模态框 */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* 背景蒙层 */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowModal(false)}
            ></div>
            
            {/* 模态框 */}
            <div className="relative bg-bg-card rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="text-base underline underline-offset-8 decoration-wavy font-medium mb-4">
                {editCategory ? '/// 编辑分类 ///' : '/// 新增分类 ///'}
              </div>
              
              <form onSubmit={handleSubmit}>
                {/* 分类名称 */}
                <div className="mb-4">
                  <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◜分类名称◝</label>
                  <input
                    type="text"
                    className={`w-full p-2 border rounded-lg ${formErrors.name ? 'border-red-500' : 'border-gray-200 dark:bg-zinc-800'}`}
                    value={newCategory.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="输入分类名称"
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>
                
                {/* Slug */}
                <div className="mb-4">
                  <label className="block text-sm dark:text-blue-500  font-medium mb-2">⋙⋙◜Slug◝</label>
                  <input
                    type="text"
                    className={`w-full p-2 border rounded-lg ${formErrors.slug ? 'border-red-500' : 'border-gray-200 dark:bg-zinc-800'}`}
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({...newCategory, slug: e.target.value})}
                    placeholder="例如：design-inspiration"
                  />
                  {formErrors.slug && (
                    <p className="text-red-500 text-xs mt-2">{formErrors.slug}</p>
                  )}
                  <p className="text-text-light text-xs mt-2">
                    用于URL的标识符，留空将自动根据名称生成
                  </p>
                </div>
                
                {/* 分类图片 */}
                <div className="mb-4">
                  <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◜分类图片◝</label>
                  
                  <div className="flex items-center space-x-2">
                    {newCategory.image ? (
                      <div className="relative w-16 h-16 rounded-md overflow-hidden border">
                        <OptimizedImage 
                          src={convertToApiImageUrl(newCategory.image)} 
                          alt="分类图片"
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    
                    {!newCategory.image ? (
                      <FileUploader
                        onUploadSuccess={handleImageUploadSuccess}
                        uploadType="category"
                        buttonText="上传图片"
                        accept="image/*"
                        fileType="图片"
                      />
                    ) : (
                      <>
                        <FileUploader
                          onUploadSuccess={handleImageUploadSuccess}
                          uploadType="category"
                          buttonText="更换图片"
                          accept="image/*"
                          fileType="图片"
                        />
                        
                        <button 
                          type="button"
                          onClick={() => setNewCategory({...newCategory, image: ''})}
                          className="px-2 py-1 text-red-500 border border-red-300 rounded-md text-xs"
                        >
                          <i className="fa-solid fa-trash-can mr-1"></i>
                          删除
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-text-light text-xs mt-2">
                    建议上传方形图片，大小不超过1MB
                  </p>
                </div>
                
                {/* 排序 */}
                <div className="mb-4">
                  <label className="block text-sm dark:text-blue-500 font-medium mb-2">⋙⋙◜排序◝</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg bg-bg dark:bg-zinc-800 border border-gray-200"
                    value={newCategory.order}
                    onChange={(e) => setNewCategory({...newCategory, order: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                  <p className="text-text-light text-xs mt-1">
                    数字越小排序越靠前，默认为0
                  </p>
                </div>
                
                {/* 描述 */}
                <div className="mb-4">
                  <label className="block text-sm dark:text-blue-500  font-medium mb-2">⋙⋙◜描述◝</label>
                  <textarea
                    className="w-full p-2 border border-gray-200 dark:bg-zinc-800 rounded-lg"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                    placeholder="输入分类描述（可选）"
                    rows={3}
                  ></textarea>
                </div>
                
                {/* 推荐分类 */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={newCategory.isFeatured}
                      onChange={(e) => setNewCategory({...newCategory, isFeatured: e.target.checked})}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="isFeatured" className="ml-2 text-sm dark:text-blue-500 font-medium">
                      ⋙⋙◜设为推荐分类◝
                    </label>
                  </div>
                  <p className="text-text-light text-xs ml-6">
                    推荐分类将在前台首页和分类页面优先显示
                  </p>
                </div>
                
                {/* 底部按钮 */}
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-text-light bg-gray-100 dark:bg-gray-700 rounded-lg"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    {isSaving ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        保存中...
                      </>
                    ) : (
                      '保存'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 