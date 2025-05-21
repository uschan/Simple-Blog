"use client";

import React, { useRef } from 'react';
import { uploadFile } from '@/lib/api';

interface SimpleFileUploaderProps {
  onUploadSuccess: (filePath: string) => void;
  onUploadError?: (error: Error) => void;
  accept?: string;
  uploadType: string;
  buttonText: string;
  className?: string;
}

/**
 * 简化版文件上传组件 - 专为解决removeChild错误问题设计
 * 此组件不会在DOM中创建或删除元素，只使用React的ref
 */
export default function SimpleFileUploader({
  onUploadSuccess,
  onUploadError,
  accept = '*/*',
  uploadType,
  buttonText,
  className = '',
}: SimpleFileUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  // 使用ref引用input元素，但不操作DOM
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理上传过程
  const handleUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);
      
      console.log('上传文件:', file.name, '类型:', uploadType);
      
      const result = await uploadFile('/api/admin/upload', formData);
      console.log('上传响应:', result);
      
      if (result.success) {
        const filePath = result.filePath || (result.data && (result.data.url || result.data.filePath));
        
        if (!filePath) {
          throw new Error('无法获取上传文件路径');
        }
        
        console.log('上传成功，文件路径:', filePath);
        onUploadSuccess(filePath);
      } else {
        throw new Error(result.message || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
    } finally {
      setIsUploading(false);
      // 重置input，允许重复上传相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  // 点击按钮触发文件选择
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="simple-uploader">
      {/* 隐藏的文件输入框 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        style={{ display: 'none' }}
      />
      
      {/* 上传按钮 */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className={`px-3 py-2 rounded-lg transition-colors border border-primary-light hover:bg-primary-light ${className}`}
      >
        {isUploading ? (
          <>
            <i className="fa-solid fa-spinner fa-spin mr-1"></i> 上传中...
          </>
        ) : (
          <>{buttonText}</>
        )}
      </button>
    </div>
  );
} 