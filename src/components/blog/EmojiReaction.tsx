'use client';

import React, { useState, useEffect, useRef } from 'react';
import './emoji-styles.css';

interface ReactionCount {
  emoji: string;
  count: number;
}

interface EmojiReactionProps {
  article: {
    id: string;
    reactionCount?: number;
    userReaction?: string;
    reactionCounts?: ReactionCount[];
  };
  className?: string;
}

// 表情定义
const reactions = [
  { emoji: 'like', label: '赞' },
  { emoji: 'haha', label: '哈哈' },
  { emoji: 'love', label: '爱心' },
  { emoji: 'sad', label: '伤心' },
  { emoji: 'angry', label: '愤怒' }
];

export default function EmojiReaction({ article, className = '' }: EmojiReactionProps) {
  const [count, setCount] = useState(article.reactionCount || 0);
  const [reaction, setReaction] = useState(article.userReaction || 'like');
  const [showSelector, setShowSelector] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<ReactionCount[]>(
    article.reactionCounts || []
  );
  // 用于稳定排序的记录最初顺序的状态
  const [initialOrder, setInitialOrder] = useState<{[key: string]: number}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasInitialized = useRef(false);
  
  // 如果没有提供reactionCounts但有reactionCount，创建默认的reactionCounts
  useEffect(() => {
    if (!article.reactionCounts && article.reactionCount && article.reactionCount > 0) {
      setReactionCounts([{ emoji: article.userReaction || 'like', count: article.reactionCount }]);
    }
    
    // 初始化表情顺序记录
    if (article.reactionCounts) {
      const orderMap: {[key: string]: number} = {};
      article.reactionCounts.forEach((item, index) => {
        orderMap[item.emoji] = index;
      });
      setInitialOrder(orderMap);
    }
  }, [article]);
  
  // 客户端挂载后初始化
  useEffect(() => {
    setMounted(true);
    
    // 添加全局点击事件关闭选择器
    const handleClickOutside = (e: MouseEvent) => {
      if (showSelector && 
          e.target instanceof Element && 
          !e.target.closest('.emoji-container')) {
        setShowSelector(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    // 延迟获取文章的反应数据，优先展示页面内容
    const timer = setTimeout(() => {
      if (mounted && !hasInitialized.current) {
        fetchReactions();
        hasInitialized.current = true;
      }
    }, 500);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      clearTimeout(timer);
    };
  }, [showSelector, mounted]);

  // 获取文章的反应数据
  const fetchReactions = async () => {
    // 如果没有文章ID，不请求数据
    if (!article.id) return;
    
    try {
      const response = await fetch(`/api/reactions?articleId=${article.id}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.reactionCounts) {
          // 创建新的顺序记录
          const newOrder = {...initialOrder};
          data.reactionCounts.forEach((item: ReactionCount) => {
            if (!(item.emoji in newOrder)) {
              // 如果是新出现的表情，放在最后
              newOrder[item.emoji] = Object.keys(newOrder).length;
            }
          });
          setInitialOrder(newOrder);
          
          // 使用稳定排序更新reactionCounts
          const sortedReactions = [...data.reactionCounts].sort((a, b) => {
            const orderA = newOrder[a.emoji] ?? 999;
            const orderB = newOrder[b.emoji] ?? 999;
            return orderA - orderB;
          });
          
          setReactionCounts(sortedReactions);
          setCount(data.totalCount || 0);
        }
      }
    } catch (error) {
      console.error('获取反应数据失败:', error);
    }
  };

  // 点击表情
  const handleReaction = async (emoji: string) => {
    // 如果正在提交，忽略点击
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // 在UI上立即给用户反馈
    const optimisticReaction = emoji;
    setReaction(optimisticReaction);
    
    // 更新本地状态（乐观UI更新）
    const updatedCounts = [...reactionCounts];
    const existingIndex = updatedCounts.findIndex(item => item.emoji === emoji);
    
    if (existingIndex >= 0) {
      // 如果表情已存在，增加计数
      updatedCounts[existingIndex] = {
        ...updatedCounts[existingIndex],
        count: updatedCounts[existingIndex].count + 1
      };
    } else {
      // 如果是新表情，添加到列表
      updatedCounts.push({ emoji, count: 1 });
      
      // 更新表情顺序记录
      if (!(emoji in initialOrder)) {
        const newOrder = {...initialOrder};
        newOrder[emoji] = Object.keys(newOrder).length;
        setInitialOrder(newOrder);
      }
    }
    
    // 使用稳定排序更新reactionCounts
    const sortedReactions = [...updatedCounts].sort((a, b) => {
      const orderA = initialOrder[a.emoji] ?? 999;
      const orderB = initialOrder[b.emoji] ?? 999;
      return orderA - orderB;
    });
    
    setReactionCounts(sortedReactions);
    setCount(sortedReactions.reduce((sum, item) => sum + item.count, 0));
    
    try {
      // 确保articleId是有效的值
      if (!article.id) {
        console.error('缺少文章ID');
        setIsSubmitting(false);
        return;
      }
      
      let retryCount = 0;
      const maxRetries = 2;
      let success = false;
      
      while (!success && retryCount <= maxRetries) {
        try {
          const response = await fetch('/api/reactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              articleId: article.id,
              reaction: emoji,
              // userId可以从用户会话中获取，这里保持匿名
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
              // 更新本地状态
              if (data.totalCount !== undefined) {
                setCount(data.totalCount);
              }
              
              if (data.reactionCounts) {
                setReactionCounts(data.reactionCounts);
              }
              
              success = true;
              // console.log('反应已保存:', data);
            } else {
              console.error('服务器返回错误:', data.error);
            }
          } else {
            const errorData = await response.json().catch(() => ({ error: '未知错误' }));
            console.error('保存反应失败', errorData);
            retryCount++;
            if (retryCount <= maxRetries) {
              // console.log(`正在重试(${retryCount}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
            }
          }
        } catch (error) {
          console.error('提交反应时网络错误:', error);
          retryCount++;
          if (retryCount <= maxRetries) {
            // console.log(`正在重试(${retryCount}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
          }
        }
      }
      
      if (!success) {
        console.error(`在${maxRetries}次尝试后仍无法保存反应`);
        // 即使失败也保持乐观UI，因为这只是点赞功能
      }
      
    } catch (error) {
      console.error('提交反应时出错:', error);
    } finally {
      setIsSubmitting(false);
      setShowSelector(false);
    }
  };

  // 获取表情图标组件
  const getEmojiIcon = (emojiType: string) => {
    switch (emojiType) {
      case 'like':
        return <LikeIcon />;
      case 'haha':
        return <HahaIcon />;
      case 'love':
        return <LoveIcon />;
      case 'sad':
        return <SadIcon />;
      case 'angry':
        return <AngryIcon />;
      default:
        return <NoReactionIcon />;
    }
  };

  // 服务端渲染占位符
  if (!mounted) {
    return <div className={`emoji-container-placeholder ${className}`}></div>;
  }

  // 总反应计数
  const totalReactionCount = reactionCounts.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={`emoji-container ${className}`}>
      {/* 主按钮 */}
      <div 
        className="emoji-button"
        onClick={() => setShowSelector(!showSelector)}
      >
        {/* 显示所有已有表情反应 */}
        <div className="emoji-reactions-row">
          {reactionCounts.length > 0 ? (
            reactionCounts.map((item, index) => (
              <div key={index} className="emoji-icon emoji-small">
                {getEmojiIcon(item.emoji)}
              </div>
            ))
          ) : (
            <div className="emoji-icon">
              {getEmojiIcon('no-reaction')}
            </div>
          )}
          <span className="emoji-count">{totalReactionCount || count}</span>
        </div>
      </div>

      {/* 表情选择器 */}
      {showSelector && (
        <div className="emoji-selector">
          {reactions.map(emoji => (
            <div
              key={emoji.emoji}
              className="emoji-option"
              onClick={() => handleReaction(emoji.emoji)}
            >
              <div className="emoji-icon">
                {getEmojiIcon(emoji.emoji)}
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

// 为TypeScript添加全局EmojiReaction类型声明
declare global {
  interface Window {
    // 使用命名空间防止冲突
    BlogEmojiReaction: typeof EmojiReaction;
  }
} 

// 在客户端挂载时赋值
if (typeof window !== 'undefined') {
  // 只在客户端环境下赋值，并检查是否已存在
  if (!window.BlogEmojiReaction) {
    window.BlogEmojiReaction = EmojiReaction;
  }
} 