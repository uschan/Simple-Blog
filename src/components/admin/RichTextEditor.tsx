'use client';

import { useState, useRef, useEffect, forwardRef } from 'react';
import dynamic from 'next/dynamic';

// 确保在客户端加载Quill样式
import 'react-quill/dist/quill.snow.css';

// 使用forwardRef创建Quill组件
const ReactQuillBase = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="bg-gray-100 dark:bg-gray-800 animate-pulse h-64 w-full rounded-lg"></div>
});

// 创建forwardRef版本的ReactQuill
const ReactQuill = forwardRef((props: any, ref: any) => {
  return <ReactQuillBase {...props} ref={ref} />;
});
ReactQuill.displayName = "ReactQuill";

interface RichTextEditorProps {
  initialValue: string;
  onChange: (content: string) => void;
}

interface QuillRange {
  index: number;
  length: number;
}

// HTML美化函数
function formatHTML(html: string): string {
  let formatted = '';
  let indent = '';
  
  // 处理自闭合标签
  html = html.replace(/<([a-zA-Z]+)([^<]*)\/>/g, '<$1$2></$1>');
  
  // 简单但有效的格式化逻辑
  const tags = html.split(/(<\/?[^>]+>)/);
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    
    // 跳过空字符串
    if (!tag.trim()) continue;
    
    // 处理结束标签
    if (tag.startsWith('</')) {
      indent = indent.slice(2); // 减少缩进
      formatted += indent + tag + '\n';
    }
    // 处理开始标签
    else if (tag.startsWith('<')) {
      formatted += indent + tag + '\n';
      
      // img, br, hr等自闭合标签不增加缩进
      if (!tag.match(/<(br|hr|img|input|link|meta|area|base|col|command|embed|keygen|param|source|track|wbr)([^>]*)>/i)) {
        indent += '  '; // 增加缩进
      }
    }
    // 处理文本内容
    else {
      const trimmed = tag.trim();
      if (trimmed) {
        formatted += indent + trimmed + '\n';
      }
    }
  }
  
  return formatted;
}

// 富文本编辑器组件
export default function RichTextEditor({ initialValue = '', onChange }: RichTextEditorProps) {
  // 内容状态
  const [content, setContent] = useState(initialValue);
  // 源代码模式的内容
  const [sourceContent, setSourceContent] = useState('');
  // 是否为源代码模式
  const [isSourceMode, setIsSourceMode] = useState(false);
  // 用于存储上传中的状态
  const [uploading, setUploading] = useState(false);
  // 组件是否挂载
  const [isMounted, setIsMounted] = useState(false);
  // 编辑器是否已初始化
  const [isEditorReady, setIsEditorReady] = useState(false);
  // 保存编辑器实例
  const editorRef = useRef<any>(null);
  // 编辑器容器引用
  const containerRef = useRef<HTMLDivElement>(null);

  // 组件挂载状态管理
  useEffect(() => {
    setIsMounted(true);
    
    // 添加全局样式来确保Quill编辑器不会消失
    const style = document.createElement('style');
    style.textContent = `
      .quill-wrapper {
        display: block !important;
        visibility: visible !important;
        position: relative;
        z-index: 1;
      }
      .quill-wrapper .ql-container {
        min-height: 300px;
        z-index: 1;
        position: static;
      }
      .quill-wrapper .ql-toolbar {
        z-index: 2;
        position: static;
      }
      .quill-wrapper .ql-editor {
        min-height: 300px;
        max-height: 600px;
        overflow-y: auto;
      }
      .quill-wrapper .ql-tooltip {
        z-index: 3;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      setIsMounted(false);
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // 加载初始内容
  useEffect(() => {
    if (initialValue && !content) {
      setContent(initialValue);
    }
  }, [initialValue, content]);

  // 确保编辑器在DOM中的存在
  useEffect(() => {
    if (!isSourceMode && editorRef.current) {
      // 用定时器检查编辑器是否在DOM中且能获取到Quill实例
      const checkEditorInterval = setInterval(() => {
        try {
          const editor = editorRef.current.getEditor();
          if (editor) {
            console.log('Quill编辑器初始化成功');
            setIsEditorReady(true);
            clearInterval(checkEditorInterval);
          }
        } catch (e) {
          console.log('等待Quill编辑器初始化...');
        }
      }, 100);

      // 5秒后清除定时器，避免无限循环
      setTimeout(() => clearInterval(checkEditorInterval), 5000);

      return () => clearInterval(checkEditorInterval);
    }
  }, [isSourceMode]);

  // 内容变更处理
  const handleContentChange = (value: string) => {
    setContent(value);
    onChange(value);
  };

  // 源代码模式下的内容变更
  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSourceContent(value);
  };

  // 源代码模式下保存内容
  const applySourceChanges = () => {
    setContent(sourceContent);
    onChange(sourceContent);
  };

  // 模式切换
  const toggleSourceMode = () => {
    if (!isSourceMode) {
      // 切换到源代码模式
      setSourceContent(formatHTML(content));
    } else {
      // 切换到可视化模式，应用源代码的更改
      applySourceChanges();
    }
    
    // 切换模式
    setIsSourceMode(!isSourceMode);
  };

  // 图片处理器
  const imageHandler = () => {
    // 创建隐藏的文件输入
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.style.display = 'none';
    
    // 监听文件选择
    input.onchange = async () => {
      if (!input.files || input.files.length === 0) {
        document.body.removeChild(input);
        return;
      }
      
      const file = input.files[0];
      setUploading(true);
      
      try {
        // 创建FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'media'); // 标记为媒体库上传
        
        // 发送上传请求
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('图片上传失败');
        }
        
        const data = await response.json();
        
        if (data.success && data.filePath) {
          // 获取当前Quill实例
          if (editorRef.current) {
            try {
              const quill = editorRef.current.getEditor();
              if (quill) {
                // 获取当前选区
                const range = quill.getSelection(true);
                
                // 在光标位置插入图片
                quill.insertEmbed(range.index, 'image', data.filePath);
                
                // 将光标向前移动
                quill.setSelection(range.index + 1);
              }
            } catch (e) {
              console.error('获取编辑器实例失败', e);
              alert('插入图片失败，请刷新页面重试');
            }
          }
        } else {
          throw new Error(data.message || '图片上传失败');
        }
      } catch (error) {
        console.error('上传图片失败:', error);
        alert(error instanceof Error ? error.message : '上传图片失败');
      } finally {
        setUploading(false);
        document.body.removeChild(input);
      }
    };
    
    document.body.appendChild(input);
    input.click();
  };

  // 清理格式处理器
  const cleanFormatHandler = () => {
    if (editorRef.current) {
      try {
        const quill = editorRef.current.getEditor();
        if (quill) {
          const range = quill.getSelection();
          if (range) {
            // 如果有选择范围，则只清理选择的文本格式
            if (range.length > 0) {
              quill.removeFormat(range.index, range.length);
            } else {
              // 如果只是光标位置，可以选择清理光标所在的元素或上一个元素
              const [line, offset] = quill.getLine(range.index);
              const lineLength = line.length();
              quill.removeFormat(range.index - offset, lineLength);
            }
          }
        }
      } catch (e) {
        console.error('清理格式失败', e);
      }
    }
  };

  // Quill编辑器配置
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'clean'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }]
      ],
      handlers: {
        image: imageHandler,
        clean: cleanFormatHandler
      }
    },
    clipboard: {
      // 允许粘贴中的HTML保留基本格式，但会规范化，防止特殊元素问题
      matchVisual: false
    },
    keyboard: {
      bindings: {
        // 添加自定义键盘快捷键来删除当前行的所有格式
        removeFormat: {
          key: 'F',
          shortKey: true,
          shiftKey: true,
          handler: function(this: any, range: any) {
            this.quill.removeFormat(range.index, range.length);
            return true;
          }
        }
      }
    }
  };

  // Quill格式配置
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image',
    'color', 'background',
    'align'
  ];

  // 在首次渲染组件后才显示编辑器，避免SSR问题
  if (!isMounted) {
    return <div className="bg-gray-100 dark:bg-gray-800 animate-pulse h-64 w-full rounded-lg"></div>;
  }

  return (
    <div ref={containerRef} className="rich-text-editor border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* 编辑器顶部工具栏 */}
      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500">
          {isEditorReady && !isSourceMode ? '编辑器已就绪' : ''}
        </div>
        <button 
          type="button" 
          onClick={toggleSourceMode}
          className={`px-3 py-1 rounded ${isSourceMode ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          <i className="fas fa-code mr-1"></i>
          {isSourceMode ? '可视化' : '源代码'}
        </button>
      </div>
      
      {/* 编辑器内容区域 */}
      <div className={uploading ? 'opacity-50 pointer-events-none' : ''}>
        {!isSourceMode ? (
          <div className="quill-wrapper" style={{ 
            position: 'relative', 
            zIndex: 1,
            display: 'block',
            visibility: 'visible'
          }}>
            <ReactQuill
              ref={editorRef}
              theme="snow"
              value={content}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              className="bg-white dark:bg-gray-900"
              preserveWhitespace={true}
              style={{ position: 'static', width: '100%' }}
            />
          </div>
        ) : (
          <div className="source-editor relative">
            <textarea
              value={sourceContent}
              onChange={handleSourceChange}
              className="w-full p-4 min-h-[300px] focus:outline-none bg-white dark:bg-gray-900 font-mono text-sm"
              placeholder="在此编辑HTML源代码..."
              onBlur={applySourceChanges}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              源代码编辑模式
            </div>
          </div>
        )}
      </div>
      
      {/* 帮助信息 */}
      <div className="text-xs text-gray-500 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        {isSourceMode 
          ? '源代码模式：您可以直接编辑HTML代码，删除无法选择的元素。切换回可视化模式时会自动保存更改。' 
          : '提示：使用清理格式按钮(擦除图标)可以删除特殊格式。快捷键Ctrl+Shift+F可以清除选中内容的所有格式。'}
      </div>
      
      {/* 上传中遮罩 */}
      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            <span>图片上传中...</span>
          </div>
        </div>
      )}
    </div>
  );
} 