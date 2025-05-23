'use client';

import { useEffect, useRef, memo } from 'react';
import EditorJS from '@editorjs/editorjs';
import Quote from '@editorjs/quote';
import ImageTool from '@editorjs/image';
import List from '@editorjs/list';
import CodeTool from '@editorjs/code';
import Paragraph from '@editorjs/paragraph';
import { uploadFile } from '@/lib/api';
import { convertToApiImageUrl } from '@/lib/utils';

interface SimpleEditorProps {
  initialValue: any;
  onChange: (content: any) => void;
}

// 使用React.memo避免不必要的重渲染
const SimpleEditor = memo(({ initialValue = {}, onChange }: SimpleEditorProps) => {
  const editorRef = useRef<EditorJS | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const contentChangeHandled = useRef(false);

  // 保存onChange回调的引用
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // 初始化编辑器
  useEffect(() => {
    // 避免重复初始化
    if (isInitialized.current || !containerRef.current) {
      return;
    }
    
    // 确保组件已挂载
    const timer = setTimeout(() => {
      try {
        // 标记为已初始化
        isInitialized.current = true;
        
        // 确保容器干净
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          
          // 创建编辑器 - 使用简化配置
          const editor = new EditorJS({
            holder: containerRef.current,
            tools: {
              paragraph: Paragraph,
              list: List,
              quote: Quote,
              code: CodeTool,
              image: {
                class: ImageTool,
                config: {
                  uploader: {
                    uploadByFile: async (file: File) => {
                      console.log('开始上传图片:', file.name, file.size);
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('type', 'media');
                      
                      try {
                        // 移除自定义loading提示，使用EditorJS自带的提示
                        console.log('调用API上传图片...');
                        const data = await uploadFile('/api/admin/upload', formData);
                        console.log('服务器上传响应:', data);
                        
                        if (data.success) {
                          // 使用URL转换函数处理路径
                          const imageUrl = convertToApiImageUrl(data.filePath);
                          console.log('转换后的完整图片URL:', imageUrl);
                          
                          // 验证URL是否可访问
                          const img = new Image();
                          img.onload = () => console.log('图片URL有效，可以加载');
                          img.onerror = () => console.error('警告: 图片URL无法加载');
                          img.src = imageUrl;
                          
                          // 准确按照EditorJS要求的格式返回
                          const result = {
                            success: 1, // 必须是数字1，不是true
                            file: {
                              url: imageUrl
                            }
                          };
                          
                          console.log('返回给EditorJS的数据:', result);
                          return result;
                        }
                        
                        console.error('上传API返回错误:', data);
                        return {
                          success: 0,
                          message: data.message || '上传失败'
                        };
                      } catch (error) {
                        // 完整记录错误信息，不吞掉异常
                        console.error('上传图片时发生异常:', error);
                        
                        // 返回EditorJS期望的错误格式
                        return {
                          success: 0,
                          message: error instanceof Error ? error.message : '上传图片失败'
                        };
                      }
                    }
                  }
                }
              }
            },
            
            data: initialValue.blocks?.length > 0 ? initialValue : {
              time: new Date().getTime(),
              blocks: []
            },
            placeholder: '开始写作...',
            minHeight: 400,
            // 明确启用默认内联工具栏及所有选项
            inlineToolbar: ['bold', 'italic', 'link'],
            // 设置工具栏位置
            tunes: ['delete', 'moveUp', 'moveDown'],
            onChange: async () => {
              try {
                // 防止初始化时触发不必要的状态更新
                if (!contentChangeHandled.current) {
                  contentChangeHandled.current = true;
                  return;
                }

                // 使用回调引用，避免闭包问题
                const savedData = await editor.save();
                onChangeRef.current(savedData);
              } catch (error) {
                console.error('保存内容出错:', error);
              }
            },
            onReady: () => {
              editorRef.current = editor;
              console.log('编辑器已准备就绪');
            },
            // 禁用自动滚动到顶部
            autofocus: false,
            // 修改基础配置
            i18n: {
              messages: {
                ui: {
                  "blockTunes": {
                    "toggler": {
                      "Click to tune": "点击配置",
                    }
                  },
                  "inlineToolbar": {
                    "converter": {
                      "Convert to": "转换为"
                    }
                  },
                  "toolbar": {
                    "toolbox": {
                      "Add": "添加内容",
                    }
                  }
                },
                toolNames: {
                  "Text": "文本",
                  "Quote": "引用",
                  "Code": "代码",
                  "Image": "图片"
                },
                tools: {
                  "image": {
                    "Caption": "图片说明",
                    "Select an Image": "选择图片"
                  },
                  "code": {
                    "Code": "代码"
                  }
                }
              }
            }
          });
        }
      } catch (error) {
        console.error('初始化编辑器失败:', error);
        isInitialized.current = false;
      }
    }, 100); // 短暂延迟确保DOM已准备好

    // 组件卸载时销毁编辑器
    return () => {
      clearTimeout(timer);
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
      isInitialized.current = false;
      contentChangeHandled.current = false;
    };
  }, [initialValue]); // 只在initialValue变化时重新初始化

  return (
    <div className="border border-gray-200 dark:border-0 rounded-lg overflow-hidden">
      <style jsx global>{`
        /* 基本样式 */
        .codex-editor__redactor {
          padding-bottom: 100px !important;
        }
        
        .ce-block__content {
          max-width: 100% !important;
          margin: 0 auto;
          position: relative;
        }
        
        .codex-editor {
          min-height: 400px !important;
        }
        
        /* 简化工具栏样式 */
        .ce-toolbar__plus,
        .ce-toolbar__settings-btn {
          color: #4338ca !important;
        }
        
        /* 修复块工具栏定位 - 调整到左侧 */
        .ce-toolbar {
          position: absolute;
          left: -10px !important; /* 调整到左侧 */
          right: auto !important;
          background: none !important;
        }
        
        .ce-toolbar__actions {
          position: absolute;
          left: -30px !important; /* 调整到左侧 */
          right: auto !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
        }
        
        .ce-settings {
          left: 0 !important;
          right: auto !important;
        }
        
        /* 仅在块激活或悬停时显示工具栏 */
        .ce-toolbar {
          opacity: 0;
          visibility: hidden;
          transition: opacity 150ms ease, visibility 150ms ease;
        }
        
        .ce-toolbar.ce-toolbar--opened,
        .ce-block:hover .ce-toolbar {
          opacity: 1;
          visibility: visible;
        }
        
        /* 强制显示内联工具栏 */
        .ce-inline-toolbar {
          position: fixed !important;
          background: #fff !important;
          border: 1px solid #e5e7eb !important;
          box-shadow: 0 3px 15px -3px rgba(13, 20, 33, 0.13) !important;
          border-radius: 4px !important;
          z-index: 9999 !important;
          opacity: 1 !important;
          visibility: visible !important;
          transform: translateX(-50%) !important;
          max-width: fit-content !important;
          transition: none !important;
          top: auto !important;
          bottom: auto !important;
          margin-top: -10px !important;
        }
        
        .ce-inline-toolbar--showed {
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        .ce-inline-toolbar[style*="display: none"] {
          display: block !important;
        }
        
        .ce-inline-toolbar__buttons {
          padding: 0 6px !important;
          display: flex !important;
          align-items: center !important;
        }
        
        .ce-inline-tool {
          width: 36px !important;
          height: 36px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 !important;
          padding: 0 !important;
          border-radius: 4px !important;
          color: #111827 !important;
        }
        
        .ce-inline-tool:hover {
          background: #f3f4f6 !important;
        }
        
        .ce-inline-tool--active {
          color: #4338ca !important;
          background: #f3f4f6 !important;
        }
        
        /* 暗模式下的内联工具栏 */
        .dark .ce-inline-toolbar {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }
        
        .dark .ce-inline-tool {
          color: #f9fafb !important;
        }
        
        .dark .ce-inline-tool:hover {
          background: #374151 !important;
        }
        
        .dark .ce-inline-tool--active {
          color: #6366f1 !important;
          background: #374151 !important;
        }
        
        /* 代码块样式 */
        .ce-code {
          background-color: #f8f9fa;
          padding: 16px;
          border-radius: 4px;
          font-family: monospace;
        }
        
        /* 夜间模式下的代码块 */
        .dark .ce-code {
          background-color: #1e293b;
          color: #e2e8f0;
        }
        
        /* 强制显示所有工具栏 - 最后的修复尝试 */
        [hidden] {
          display: block !important;
        }
      `}</style>
      <div 
        ref={containerRef} 
        className="bg-white dark:bg-zinc-900 min-h-[400px] py-4 px-8"
      />
    </div>
  );
});

// 添加组件名称，便于调试
SimpleEditor.displayName = 'SimpleEditor';

export default SimpleEditor; 