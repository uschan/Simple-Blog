'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { uploadFile } from '@/lib/api';
import { convertToApiImageUrl } from '@/lib/utils';

// 添加全局变量声明
declare global {
  interface Window {
    tiptapEditor: Editor | null;
  }
}

interface TiptapEditorProps {
  initialValue?: string;
  onChange: (content: any) => void;
}

const TiptapEditor = ({ initialValue = '', onChange }: TiptapEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // 禁用标题
        bulletList: {
          HTMLAttributes: {
            class: 'pl-2 list-disc my-2',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'pl-2 list-decimal my-2',
          },
        },
      }),
      Link.configure({
        openOnClick: true, // 允许点击链接时打开
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer hover:text-blue-700',
          target: '_blank', // 在新标签页打开链接
          rel: 'noopener noreferrer', // 安全属性
        },
        validate: url => /^https?:\/\//.test(url), // 验证是否有效URL
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full rounded-md my-2',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose pl-0 list-none',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start my-2',
        },
      }),
      Placeholder.configure({
        placeholder: '开始写作...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200 text-yellow-800 mx-1 px-1 rounded',
        },
      }),
    ],
    content: initialValue,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose dark:prose-invert focus:outline-none w-full max-w-full px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      // 触发onChange回调，传递编辑器内容
      const json = editor.getJSON();
      const html = editor.getHTML();
      onChange({ json, html });
    },
  });

  // 保存编辑器引用到ref和全局变量
  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
      
      // 设置全局变量以便外部访问
      if (typeof window !== 'undefined') {
        window.tiptapEditor = editor;
      }
      
      // 在组件卸载时清除全局引用
      return () => {
        if (typeof window !== 'undefined') {
          window.tiptapEditor = null;
        }
      };
    }
  }, [editor]);

  // 用于处理图片上传的函数
  const handleImageUpload = useCallback(() => {
    if (!editorRef.current) return;
    
    // 使用ref引用隐藏的file input而不是动态创建
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // 处理文件选择后的上传
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentEditor = editorRef.current;
    if (!currentEditor || !event.target.files?.length) return;
    
    try {
      const file = event.target.files[0];
      console.log('开始上传图片:', file.name, file.size);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'media');
      
      // 修正上传路径，移除了前导/api (因为uploadFile内部会添加)
      const data = await uploadFile('/admin/upload', formData);
      console.log('服务器上传响应:', data);
      
      if (data.success) {
        const imageUrl = convertToApiImageUrl(data.filePath);
        console.log('转换后的完整图片URL:', imageUrl);
        currentEditor.chain().focus().setImage({ src: imageUrl }).run();
      } else {
        throw new Error(data.message || '上传失败');
      }
    } catch (error) {
      console.error('图片添加失败:', error);
      alert('图片添加失败，请重试');
    }
    
    // 重置input，允许重复选择相同文件
    if (event.target) {
      event.target.value = '';
    }
  }, []);

  // 添加链接功能
  const setLink = useCallback(() => {
    if (!editorRef.current) return;
    const currentEditor = editorRef.current;
    
    const previousUrl = currentEditor.getAttributes('link').href;
    const url = window.prompt('输入链接地址:', previousUrl);
    
    // 如果取消或链接为空，则移除链接
    if (url === null) return;
    
    if (url === '') {
      currentEditor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    // 确保链接有 http:// 或 https:// 前缀
    const validUrl = /^https?:\/\//.test(url) ? url : `https://${url}`;
    
    currentEditor.chain().focus().extendMarkRange('link').setLink({ href: validUrl }).run();
  }, []);

  // 客户端渲染保障
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="border rounded-md p-4 h-[200px] bg-gray-50 dark:bg-gray-900">加载编辑器...</div>;
  }

  if (!editor) {
    return null;
  }

  return (
    <div className="relative border border-gray-200 dark:border-0 rounded-lg overflow-hidden">
      <div>
        {/* 隐藏的文件上传输入框 */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {/* 工具栏 */}
        <div className="text-sm sticky top-0 z-10 grid grid-flow-col auto-cols-max gap-1 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-2 overflow-x-auto">
          <button
            key="bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-6 h-6 flex items-center justify-center rounded ${
              editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
            title="粗体"
          >
            <i className="fas fa-bold"></i>
          </button>
          <button
            key="italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-6 h-6 flex items-center justify-center rounded ${
              editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
            title="斜体"
          >
            <i className="fas fa-italic"></i>
          </button>

          <button
            key="highlight"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`w-6 h-6 flex items-center justify-center rounded ${
              editor.isActive('highlight') ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
            title="文本高亮"
          >
            <i className="fas fa-highlighter"></i>
          </button>
          <span key="divider1" className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></span>
          
          <button
            key="bulletList"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`w-6 h-6 flex items-center justify-center rounded ${
              editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
            title="无序列表"
          >
            <i className="fas fa-list-ul"></i>
          </button>
          <button
            key="orderedList"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`w-6 h-6 flex items-center justify-center rounded ${
              editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
            title="有序列表"
          >
            <i className="fas fa-list-ol"></i>
          </button>

          <span key="divider2" className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></span>
          
          <button
            key="blockquote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`w-6 h-6 flex items-center justify-center rounded ${
              editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
            title="引用"
          >
            <i className="fas fa-quote-right"></i>
          </button>
          <button
            key="codeBlock"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`w-6 h-6 flex items-center justify-center rounded ${
              editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
            title="代码块"
          >
            <i className="fas fa-laptop-code"></i>
          </button>
          <button
            key="code"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`w-6 h-6 flex items-center justify-center rounded ${
              editor.isActive('code') ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
            title="行内代码"
          >
            <i className="fas fa-code"></i>
          </button>
          <button
            key="image"
            onClick={handleImageUpload}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
            title="插入图片"
          >
            <i className="fas fa-image"></i>
          </button>
          <button
            key="link"
            onClick={setLink}
            className={`w-6 h-6 flex items-center justify-center rounded ${
              editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
            title="添加链接"
          >
            <i className="fas fa-link"></i>
          </button>
          <span key="divider3" className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></span>
          
          <button
            key="undo"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={`w-6 h-6 flex items-center justify-center rounded ${
              !editor.can().undo() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
            title="撤销"
          >
            <i className="fas fa-undo"></i>
          </button>
          <button
            key="redo"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={`w-6 h-6 flex items-center justify-center rounded ${
              !editor.can().redo() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
            title="重做"
          >
            <i className="fas fa-redo"></i>
          </button>
        </div>
      </div>

      {/* 编辑内容区域 */}
      <EditorContent 
        editor={editor}
        className="text-sm text-text-light prose-lg min-h-[200px] bg-white dark:bg-zinc-900 overflow-y-auto" 
      />

      {/* 编辑器样式 */}
      <style jsx global>{`
        /* 占位符样式 */
        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
          font-size: 12px;
        }
        
        /* 改进列表样式 */
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 1em 0;
        }
        
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 1em 0;
        }
        
        .ProseMirror li {
          margin-bottom: 0.5em;
        }
        
        .ProseMirror li p {
          margin: 0;
        }
        
        /* 任务列表样式 */
        ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        
        li[data-type="taskItem"] {
          display: flex;
          align-items: flex-start;
          margin-bottom: 0.5em;
        }
        
        li[data-type="taskItem"] > label {
          margin-right: 0.5em;
          user-select: none;
        }
        
        li[data-type="taskItem"] > div {
          flex: 1;
        }
        
        input[type="checkbox"] {
          cursor: pointer;
        }
        
        /* 改进图片样式 */
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          transition: filter 0.1s ease-in-out;
          margin: 1em 0;
        }
        
        .ProseMirror img:hover {
          cursor: pointer;
          filter: brightness(90%);
        }
        
        /* 链接样式 */
        .ProseMirror, code  {
          font-family: Raleway,'Eras ITC','京華老宋体', Arial, sans-serif; 
        }
        .ProseMirror a {
          margin: 0 5px;
          color: #3b82f6;
          text-decoration: underline;
          cursor: pointer;
          pointer-events: auto !important; /* 确保链接可点击 */
        }
        
        .ProseMirror a:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }
        .dark .ProseMirror strong {
          font-weight: 900;
          color: #fff;
        }
        /* 代码块样式 */
        .ProseMirror pre {
          background-color: #f8f9fa;
          border-radius: 0.3rem;
          padding: 0.75rem 1rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .ProseMirror p code{
          color: rgb(194 65 12 / var(--tw-text-opacity, 1));
          background-color: rgb(226 232 240 / var(--tw-bg-opacity, 1));
          font-style: italic;
          border-radius: 3px;
          padding: 0 0.25rem;
          margin: 0 0.25rem;
        }
        .dark .ProseMirror pre {
          background-color: #1e293b;
          color: #e2e8f0;
        }
        
        /* 引用样式 */
        .ProseMirror blockquote {
          border-left: 4px solid #e2e8f0;
          margin-left: 0;
          padding-left: 1rem;
          font-style: italic;
          color: #64748b;
          margin: 1rem 0;
        }
        
        .dark .ProseMirror blockquote {
          border-left-color: #475569;
          color: #94a3b8;
        }

        /* 确保编辑区域中的所有元素可交互 */
        .ProseMirror {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

export default TiptapEditor; 