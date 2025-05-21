"use client";

import React, { useState, useRef } from 'react';
import { uploadFile } from '@/lib/api';

interface FileUploaderProps {
  onUploadSuccess: (filePath: string) => void;
  onUploadError?: (error: Error) => void;
  fileType?: string;
  accept?: string;
  uploadType: string;
  buttonText: string;
  className?: string;
  multiple?: boolean;
  onMultipleUploadSuccess?: (filePaths: string[]) => void;
}

/**
 * 通用文件上传
 * 
 * @param onUploadSuccess 上传成功回调，参数为文件路径
 * @param onUploadError 上传失败回调
 * @param fileType 文件类型描述，用于显示
 * @param accept 接受的文件类型
 * @param uploadType 上传类型，传递给API
 * @param buttonText 按钮文字
 * @param className 自定义类名
 * @param multiple 是否支持多选
 * @param onMultipleUploadSuccess 多文件上传成功回调
 */
export default function FileUploader({
  onUploadSuccess,
  onUploadError,
  fileType = '文件',
  accept = '*/*',
  uploadType,
  buttonText,
  className = '',
  multiple = false,
  onMultipleUploadSuccess
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [completedFiles, setCompletedFiles] = useState(0);
  
  // 使用React的ref存储input元素引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      if (multiple && files.length > 1) {
        // 多文件上传
        setTotalFiles(files.length);
        setCompletedFiles(0);
        
        const uploadedPaths: string[] = [];
        const failedUploads: Error[] = [];
        
        for (let i = 0; i < files.length; i++) {
          try {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', uploadType);
            
            setCompletedFiles(i);
            
            const result = await uploadFile('/api/admin/upload', formData);
            
            if (result.success) {
              const filePath = result.filePath || (result.data && (result.data.url || result.data.filePath));
              if (filePath) {
                uploadedPaths.push(filePath);
              } else {
                throw new Error('无法获取上传文件路径');
              }
            } else {
              throw new Error(result.message || `${fileType}上传失败`);
            }
          } catch (error) {
            console.error(`文件 ${i+1} 上传失败:`, error);
            if (error instanceof Error) {
              failedUploads.push(error);
            }
          }
        }
        
        setCompletedFiles(files.length);
        
        // 回调通知结果
        if (uploadedPaths.length > 0 && onMultipleUploadSuccess) {
          onMultipleUploadSuccess(uploadedPaths);
        }
        
        if (uploadedPaths.length === 0 && failedUploads.length > 0 && onUploadError) {
          onUploadError(new Error(`上传失败: ${failedUploads.length} 个文件上传失败`));
        }
      } else {
        // 单文件上传
        const file = files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', uploadType);
        
        console.log('[API] 上传文件:', `POST /api/admin/upload`);
        const result = await uploadFile('/api/admin/upload', formData);
        console.log('单文件上传响应:', result);
        
        if (result.success) {
          const filePath = result.filePath || (result.data && (result.data.url || result.data.filePath));
          
          if (!filePath) {
            throw new Error('无法获取上传文件路径');
          }
          
          console.log('单文件上传成功，文件路径:', filePath);
          onUploadSuccess(filePath);
        } else {
          throw new Error(result.message || `${fileType}上传失败`);
        }
      }
    } catch (error) {
      console.error('上传失败:', error);
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
    } finally {
      setIsUploading(false);
      setTotalFiles(0);
      setCompletedFiles(0);
      
      // 重置input值，允许再次上传相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // 处理上传按钮点击
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept={accept}
        multiple={multiple}
      />
      <button 
        type="button" 
        onClick={handleButtonClick}
        disabled={isUploading}
        className={`px-3 py-2 rounded-lg transition-colors border border-primary-light hover:bg-primary-light ${className}`}
      >
        {isUploading ? (
          <>
            <i className="fa-solid fa-spinner fa-spin mr-1"></i> 
            {multiple && totalFiles > 1 
              ? `上传中... (${completedFiles}/${totalFiles})` 
              : '上传中...'
            }
          </>
        ) : (
          <>{buttonText}</>
        )}
      </button>
    </>
  );
}