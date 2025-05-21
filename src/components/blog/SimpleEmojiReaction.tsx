'use client';

import { useState, useEffect } from 'react';

type SimpleEmojiReactionProps = {
  reaction?: string;
  count?: number;
  className?: string;
  articleId?: string;
};

// 表情定义
const reactions = [
  { emoji: 'like', label: '赞', color: '#FFD835' },
  { emoji: 'haha', label: '哈哈', color: '#FFD835' },
  { emoji: 'love', label: '爱心', color: '#FF493B' },
  { emoji: 'sad', label: '伤心', color: '#7ACE44' },
  { emoji: 'angry', label: '愤怒', color: '#FF493B' }
];

export default function SimpleEmojiReaction({ 
  reaction = 'like', 
  count = 0, 
  className = '',
  articleId = '' 
}: SimpleEmojiReactionProps) {
  const [selectedReaction, setSelectedReaction] = useState(reaction);
  const [reactionCount, setReactionCount] = useState(count);
  const [showSelector, setShowSelector] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 客户端挂载后初始化
  useEffect(() => {
    setMounted(true);
    
    // 添加全局点击事件关闭选择器
    const handleClickOutside = (e: MouseEvent) => {
      if (showSelector && 
          e.target instanceof Element && 
          !e.target.closest('.emoji-reaction-container')) {
        setShowSelector(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSelector]);

  // 处理点击反应
  const handleReactionClick = () => {
    if (selectedReaction === 'no-reaction') {
      // 如果当前没有选择表情，打开选择器
      setShowSelector(true);
    } else {
      // 已有选择的情况下，点击切换显示选择器
      setShowSelector(!showSelector);
    }
  };

  // 选择表情
  const selectReaction = async (emoji: string) => {
    // 如果正在提交，忽略点击
    if (isSubmitting) return;
    
    // 立即更新UI，提供即时反馈
    setSelectedReaction(emoji);
    setReactionCount(prev => prev + 1);
    setShowSelector(false);
    setIsSubmitting(true);
    
    try {
      // 调用API保存数据
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId: articleId,
          reaction: emoji,
          // 可以添加用户ID，如果有的话
        }),
      });
      
      // 处理API响应
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 可以选择使用服务器返回的计数
          if (data.newCount) {
            setReactionCount(data.newCount);
          }
          console.log('反应已保存');
        }
      } else {
        console.error('保存反应失败');
        // 如果保存失败，可以考虑回滚UI状态
      }
    } catch (error) {
      console.error('提交反应时出错:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 服务端渲染占位符
  if (!mounted) {
    return <div className={`emoji-reaction-placeholder ${className}`}></div>;
  }

  return (
    <div className="emoji-reaction-container relative">
      {/* 主表情按钮 */}
      <div 
        className="emoji-main-button flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
        onClick={handleReactionClick}
      >
        {/* 显示当前表情 */}
        <div className="emoji-icon-wrapper w-5 h-5">
          {selectedReaction === 'like' && <LikeIcon />}
          {selectedReaction === 'haha' && <HahaIcon />}
          {selectedReaction === 'love' && <LoveIcon />}
          {selectedReaction === 'sad' && <SadIcon />}
          {selectedReaction === 'angry' && <AngryIcon />}
          {selectedReaction === 'no-reaction' && <NoReactionIcon />}
        </div>
        
        {/* 显示计数 */}
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {reactionCount > 0 ? reactionCount : ''}
        </span>
      </div>

      {/* 表情选择器 */}
      {showSelector && (
        <div className="emoji-reaction-selector absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 z-10 flex gap-2 border border-gray-200 dark:border-gray-700">
          {reactions.map(item => (
            <div 
              key={item.emoji}
              className="emoji-option p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => selectReaction(item.emoji)}
              title={item.label}
            >
              <div className="w-6 h-6">
                {item.emoji === 'like' && <LikeIcon />}
                {item.emoji === 'haha' && <HahaIcon />}
                {item.emoji === 'love' && <LoveIcon />}
                {item.emoji === 'sad' && <SadIcon />}
                {item.emoji === 'angry' && <AngryIcon />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// SVG图标组件
function NoReactionIcon() {
  return (
    <svg viewBox="0 0 111 110.6" className="w-full h-full">
      <g>
        <path fill="#b7b7b7" d="M110.8,60.1C99.9,77,79.2,88.4,55.5,88.4c-23.7,0-44.3-11.4-55.2-28.2c0.2,1.9,0.4,3.8,0.8,5.7c0.2,1,0.4,2,0.7,2.9c6.1,24,27.8,41.8,53.8,41.8c26,0,47.7-17.8,53.8-41.8c0.3-1.2,0.6-2.4,0.8-3.6L110.8,60.1z"/>
        <path fill="#d6d6d6" d="M0,55.3c0,1.6,0.1,3.2,0.2,4.8C11.1,77,31.8,88.4,55.5,88.4c23.7,0,44.4-11.4,55.3-28.3c0.1-1.6,0.2-3.2,0.2-4.8c0-5.3-0.8-10.5-2.2-15.4l0-1.2c-0.1,0-0.2,0.1-0.4,0.1C101.4,16.3,80.4,0,55.5,0C30.7,0,9.6,16.3,2.6,38.7h0v0C0.9,43.9,0,49.5,0,55.3"/>
        <path fill="none" stroke="#2b2b2b" strokeWidth="4.173" strokeLinecap="round" strokeLinejoin="round" d="M38.8,60.1c0,12.5,8.3,16.7,16.7,16.7s16.7-4.2,16.7-16.7"/>
        <path fill="#2b2b2b" d="M42.8,42.2c0,3.4-2.8,6.2-6.2,6.2s-6.2-2.8-6.2-6.2c0-3.4,2.8-6.2,6.2-6.2S42.8,38.8,42.8,42.2"/>
        <path fill="#2b2b2b" d="M78.6,42.2c0,3.4-2.8,6.2-6.2,6.2c-3.4,0-6.2-2.8-6.2-6.2c0-3.4,2.8-6.2,6.2-6.2C75.9,36.1,78.6,38.8,78.6,42.2"/>
      </g>
    </svg>
  );
}

function LikeIcon() {
  return (
    <svg viewBox="0 0 111 110.6" className="w-full h-full">
      <g>
        <path fill="#DDBE3C" d="M110.8,60.1C99.9,77,79.2,88.4,55.5,88.4c-23.7,0-44.3-11.4-55.2-28.2c0.2,1.9,0.4,3.8,0.8,5.7c0.2,1,0.4,2,0.7,2.9c6.1,24,27.8,41.8,53.8,41.8c26,0,47.7-17.8,53.8-41.8c0.3-1.2,0.6-2.4,0.8-3.6L110.8,60.1z"/>
        <path fill="#FFD835" d="M0,55.3c0,1.6,0.1,3.2,0.2,4.8C11.1,77,31.8,88.4,55.5,88.4c23.7,0,44.4-11.4,55.3-28.3c0.1-1.6,0.2-3.2,0.2-4.8c0-5.3-0.8-10.5-2.2-15.4l0-1.2c-0.1,0-0.2,0.1-0.4,0.1C101.4,16.3,80.4,0,55.5,0C30.7,0,9.6,16.3,2.6,38.7h0v0C0.9,43.9,0,49.5,0,55.3"/>
        <path fill="none" stroke="#795523" strokeWidth="4.173" strokeLinecap="round" strokeLinejoin="round" d="M38.8,60.1c0,12.5,8.3,16.7,16.7,16.7s16.7-4.2,16.7-16.7"/>
        <path fill="#795523" d="M42.8,42.2c0,3.4-2.8,6.2-6.2,6.2s-6.2-2.8-6.2-6.2c0-3.4,2.8-6.2,6.2-6.2S42.8,38.8,42.8,42.2"/>
        <path fill="#795523" d="M78.6,42.2c0,3.4-2.8,6.2-6.2,6.2c-3.4,0-6.2-2.8-6.2-6.2c0-3.4,2.8-6.2,6.2-6.2C75.9,36.1,78.6,38.8,78.6,42.2"/>
      </g>
    </svg>
  );
}

function HahaIcon() {
  return (
    <svg viewBox="0 0 111 110.6" className="w-full h-full">
      <g>
        <path fill="#DDBE3C" d="M110.8,60.1C99.9,77,79.2,88.4,55.5,88.4c-23.7,0-44.3-11.4-55.2-28.2c0.2,1.9,0.4,3.8,0.8,5.7c0.2,1,0.4,2,0.7,2.9c6.1,24,27.8,41.8,53.8,41.8c26,0,47.7-17.8,53.8-41.8c0.3-1.2,0.6-2.4,0.8-3.6L110.8,60.1z"/>
        <path fill="#FFD835" d="M0,55.3c0,1.6,0.1,3.2,0.2,4.8C11.1,77,31.8,88.4,55.5,88.4c23.7,0,44.4-11.4,55.3-28.3c0.1-1.6,0.2-3.2,0.2-4.8c0-5.3-0.8-10.5-2.2-15.4l0-1.2c-0.1,0-0.2,0.1-0.4,0.1C101.4,16.3,80.4,0,55.5,0C30.7,0,9.6,16.3,2.6,38.7h0v0C0.9,43.9,0,49.5,0,55.3"/>
        <path fill="#795523" d="M72.2,58.5H38.8c0,15,8.3,19.9,16.7,19.9S72.2,73.5,72.2,58.5"/>
        <path fill="none" stroke="#795523" strokeWidth="4.561" strokeLinecap="round" strokeLinejoin="round" d="M72.2,58.5H38.8c0,15,8.3,19.9,16.7,19.9S72.2,73.5,72.2,58.5z"/>
        <path fill="none" stroke="#00BAFF" strokeWidth="8.346" strokeLinecap="round" strokeLinejoin="round" d="M78.5,47.5c0-4.2-3.9-4.2-8.1-4.2"/>
        <polyline fill="none" stroke="#795523" strokeWidth="4.173" strokeLinecap="round" strokeLinejoin="round" points="74.3,34.9 65.9,43.3 78.5,43.3"/>
        <path fill="none" stroke="#00BFF7" strokeWidth="8.346" strokeLinecap="round" strokeLinejoin="round" d="M39,43.3c-4.2,0-8.6,0-8.6,4.2"/>
        <polyline fill="none" stroke="#795523" strokeWidth="4.173" strokeLinecap="round" strokeLinejoin="round" points="34.5,34.9 42.9,43.3 30.4,43.3"/>
      </g>
    </svg>
  );
}

function LoveIcon() {
  return (
    <svg viewBox="0 0 111 110.6" className="w-full h-full">
      <g>
        <path fill="#DDBE3C" d="M110.8,60.1C99.9,77,79.2,88.4,55.5,88.4c-23.7,0-44.3-11.4-55.2-28.2c0.2,1.9,0.4,3.8,0.8,5.7c0.2,1,0.4,2,0.7,2.9c6.1,24,27.8,41.8,53.8,41.8c26,0,47.7-17.8,53.8-41.8c0.3-1.2,0.6-2.4,0.8-3.6L110.8,60.1z"/>
        <path fill="#FFD835" d="M0,55.3c0,1.6,0.1,3.2,0.2,4.8C11.1,77,31.8,88.4,55.5,88.4c23.7,0,44.4-11.4,55.3-28.3c0.1-1.6,0.2-3.2,0.2-4.8c0-5.3-0.8-10.5-2.2-15.4l0-1.2c-0.1,0-0.2,0.1-0.4,0.1C101.4,16.3,80.4,0,55.5,0C30.7,0,9.6,16.3,2.6,38.7h0v0C0.9,43.9,0,49.5,0,55.3"/>
        <path fill="#795523" d="M72.2,58.5H38.8c0,15,8.3,19.9,16.7,19.9S72.2,73.5,72.2,58.5"/>
        <path fill="none" stroke="#795523" strokeWidth="4.561" strokeLinecap="round" strokeLinejoin="round" d="M72.2,58.5H38.8c0,15,8.3,19.9,16.7,19.9S72.2,73.5,72.2,58.5z"/>
        <path fill="#FF493B" d="M68.5,35.2c1,0,1.8,0.3,2.5,0.8c0.5,0.3,0.9,0.7,1.3,1.1c0.1,0.1,0.1,0.1,0.2,0c0.5-0.5,1.1-1,1.8-1.3c1.2-0.7,2.5-0.7,3.7-0.2c1.4,0.5,2.2,1.5,2.5,2.9c0.3,1.6-0.2,2.9-1.1,4.2c-0.4,0.5-0.9,1-1.4,1.5c-0.8,0.8-1.7,1.6-2.5,2.4c-0.9,0.9-1.8,1.7-2.7,2.6c-0.3,0.3-0.6,0.3-0.9,0c-1.4-1.4-2.8-2.7-4.2-4.1c-0.5-0.5-1-1-1.5-1.5c-0.8-0.8-1.5-1.8-1.8-2.9c-0.4-1.4-0.2-2.8,0.7-4c0.6-0.8,1.5-1.2,2.5-1.3C67.9,35.2,68.2,35.2,68.5,35.2"/>
        <path fill="#FF493B" d="M33.9,35.2c1,0,1.8,0.3,2.5,0.8c0.5,0.3,0.9,0.7,1.3,1.1c0.1,0.1,0.1,0.1,0.2,0c0.5-0.5,1.1-1,1.8-1.3c1.2-0.7,2.5-0.7,3.7-0.2c1.4,0.5,2.2,1.5,2.5,2.9c0.3,1.6-0.2,2.9-1.1,4.2c-0.4,0.5-0.9,1-1.4,1.5c-0.8,0.8-1.7,1.6-2.5,2.4c-0.9,0.9-1.8,1.7-2.7,2.6c-0.3,0.3-0.6,0.3-0.9,0c-1.4-1.4-2.8-2.7-4.2-4.1c-0.5-0.5-1-1-1.5-1.5c-0.8-0.8-1.5-1.8-1.8-2.9c-0.4-1.4-0.2-2.8,0.7-4c0.6-0.8,1.5-1.2,2.5-1.3C33.3,35.2,33.6,35.2,33.9,35.2"/>
      </g>
    </svg>
  );
}

function SadIcon() {
  return (
    <svg viewBox="0 0 111 110.6" className="w-full h-full">
      <g>
        <path fill="#68AA3D" d="M110.8,60.1C99.9,77,79.2,88.4,55.5,88.4c-23.7,0-44.3-11.4-55.2-28.2c0.2,1.9,0.4,3.8,0.8,5.7c0.2,1,0.4,2,0.7,2.9c6.1,24,27.8,41.8,53.8,41.8c26,0,47.7-17.8,53.8-41.8c0.3-1.2,0.6-2.4,0.8-3.6L110.8,60.1z"/>
        <path fill="#7ACE44" d="M0,55.3c0,1.6,0.1,3.2,0.2,4.8C11.1,77,31.8,88.4,55.5,88.4c23.7,0,44.4-11.4,55.3-28.3c0.1-1.6,0.2-3.2,0.2-4.8c0-5.3-0.8-10.5-2.2-15.4l0-1.2c-0.1,0-0.2,0.1-0.4,0.1C101.4,16.3,80.4,0,55.5,0C30.7,0,9.6,16.3,2.6,38.7h0v0C0.9,43.9,0,49.5,0,55.3"/>
        <path fill="none" stroke="#425929" strokeWidth="4.173" strokeLinecap="round" strokeLinejoin="round" d="M72.2,74c0-5-7.5-9.1-16.7-9.1S38.8,69,38.8,74"/>
        <path fill="#425929" d="M42.8,42.2c0,3.4-2.8,6.2-6.2,6.2s-6.2-2.8-6.2-6.2c0-3.4,2.8-6.2,6.2-6.2S42.8,38.8,42.8,42.2"/>
        <path fill="#425929" d="M78.6,42.2c0,3.4-2.8,6.2-6.2,6.2c-3.4,0-6.2-2.8-6.2-6.2c0-3.4,2.8-6.2,6.2-6.2C75.9,36.1,78.6,38.8,78.6,42.2"/>
      </g>
    </svg>
  );
}

function AngryIcon() {
  return (
    <svg viewBox="0 0 111 110.6" className="w-full h-full">
      <g>
        <path fill="#D83125" d="M110.8,60.1C99.9,77,79.2,88.4,55.5,88.4c-23.7,0-44.3-11.4-55.2-28.2c0.2,1.9,0.4,3.8,0.8,5.7c0.2,1,0.4,2,0.7,2.9c6.1,24,27.8,41.8,53.8,41.8c26,0,47.7-17.8,53.8-41.8c0.3-1.2,0.6-2.4,0.8-3.6L110.8,60.1z"/>
        <path fill="#FF493B" d="M0,55.3c0,1.6,0.1,3.2,0.2,4.8C11.1,77,31.8,88.4,55.5,88.4c23.7,0,44.4-11.4,55.3-28.3c0.1-1.6,0.2-3.2,0.2-4.8c0-5.3-0.8-10.5-2.2-15.4l0-1.2c-0.1,0-0.2,0.1-0.4,0.1C101.4,16.3,80.4,0,55.5,0C30.7,0,9.6,16.3,2.6,38.7h0v0C0.9,43.9,0,49.5,0,55.3"/>
        <path fill="#7C150B" d="M28.5,42.2c0,3.4,2.8,6.2,6.2,6.2s6.2-2.8,6.2-6.2"/>
        <path fill="none" stroke="#7C150B" strokeWidth="4.173" strokeLinecap="round" strokeLinejoin="round" d="M28.5,42.2c0,3.4,2.8,6.2,6.2,6.2s6.2-2.8,6.2-6.2"/>
        <path fill="#7C150B" d="M80.5,40c0,3.4-2.8,6.2-6.2,6.2c-3.4,0-6.2-2.8-6.2-6.2"/>
        <path fill="none" stroke="#7C150B" strokeWidth="4.173" strokeLinecap="round" strokeLinejoin="round" d="M80.5,40c0,3.4-2.8,6.2-6.2,6.2c-3.4,0-6.2-2.8-6.2-6.2"/>
        <path fill="none" stroke="#7C150B" strokeWidth="4.173" strokeLinecap="round" strokeLinejoin="round" d="M72.2,74c0-5-7.5-9.1-16.7-9.1S38.8,69,38.8,74"/>
        <path fill="none" stroke="#7C150B" strokeWidth="4.173" strokeLinecap="round" strokeLinejoin="round" d="M24.5,38.6l14.1,5.9 M72.1,37.8L87,32"/>
      </g>
    </svg>
  );
} 