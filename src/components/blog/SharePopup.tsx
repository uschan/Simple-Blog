'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import shareQuotesData from '@/data/shareQuotes.json';

interface SharePopupProps {
  url: string;
  title: string;
  summary?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ShareQuote {
  id: number;
  text: string;
  author: string;
}

export default function SharePopup({ url, title, summary = '', isOpen, onClose }: SharePopupProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [randomQuote, setRandomQuote] = useState<ShareQuote | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 处理完整URL
  const fullUrl = typeof window !== 'undefined' ? new URL(url, window.location.origin).toString() : url;
  
  // 处理平台分享URL
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}&quote=${encodeURIComponent(title)}`,
    weibo: `https://service.weibo.com/share/share.php?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(title)}`,
    reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(title)}`,
    pinterest: `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(fullUrl)}&description=${encodeURIComponent(title)}`
  };
  
  // 获取随机语录
  const getRandomQuote = () => {
    const quotes = shareQuotesData.quotes;
    if (quotes && quotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      return quotes[randomIndex];
    }
    return null;
  };
  
  // 复制链接
  const copyLink = () => {
    if (inputRef.current) {
      inputRef.current.select();
      navigator.clipboard.writeText(fullUrl).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        console.error('复制失败:', err);
        // 回退方案
        try {
          document.execCommand('copy');
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        } catch (e) {
          console.error('复制失败(回退方案):', e);
        }
      });
    }
  };
  
  // 点击空白处关闭
  const handleClickOutside = (e: MouseEvent | TouchEvent) => {
    if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
      onClose();
    }
  };
  
  // 处理ESC键关闭
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  
  // 客户端挂载判断和随机语录获取
  useEffect(() => {
    setIsMounted(true);
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      // 弹窗打开时获取随机语录
      setRandomQuote(getRandomQuote());
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // 防止服务器端渲染错误
  if (!isMounted || !isOpen) return null;
  
  // 使用Portal渲染到body层级
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
          {/* 遮罩层动画 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />
          
          {/* 弹窗容器 */}
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 350,
              duration: 0.3 
            }}
            className="w-full max-w-md mx-auto px-4 md:pb-0 md:px-0 relative z-10"
          >
            <div 
              ref={popupRef}
              className="bg-bg-card pb-10 rounded-t-2xl md:rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.2)] w-full overflow-hidden"
            >
              {/* 顶部拖动条 - 移动端友好 */}
              <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
                <div className="w-10 h-1 bg-gray-200 dark:bg-orange-600 rounded-full"></div>
              </div>
              
              {/* 随机语录区域 */}
              {randomQuote && (
                <div className="px-5 pt-4 pb-2">
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3.5 border border-gray-200 dark:border-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{randomQuote.text}"</p>
                    <p className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1.5">—— {randomQuote.author}</p>
                  </div>
                </div>
              )}
              
              {/* 分享平台 */}
              <div className="p-5">
                <div className="grid grid-cols-5 gap-3 mb-6">
                  {/* X/Twitter */}
                  <motion.a 
                    href={shareUrls.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white shadow-md">
                      <i className="fab fa-x-twitter text-3xl"></i>
                    </div>
                    <span className="text-xs">X</span>
                  </motion.a>
                  
                  {/* Facebook */}
                  <motion.a 
                    href={shareUrls.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white shadow-md">
                      <i className="fab fa-facebook-f text-3xl"></i>
                    </div>
                    <span className="text-xs">Facebook</span>
                  </motion.a>
                  
                  {/* 微博 */}
                  <motion.a 
                    href={shareUrls.weibo} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#E6162D] flex items-center justify-center text-white shadow-md">
                      <i className="fab fa-weibo text-3xl"></i>
                    </div>
                    <span className="text-xs">微博</span>
                  </motion.a>
                  
                  {/* Reddit */}
                  <motion.a 
                    href={shareUrls.reddit} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FF4500] flex items-center justify-center text-white shadow-md">
                      <i className="fab fa-reddit-alien text-3xl"></i>
                    </div>
                    <span className="text-xs">Reddit</span>
                  </motion.a>
                  
                  {/* Pinterest */}
                  <motion.a 
                    href={shareUrls.pinterest} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#E60023] flex items-center justify-center text-white shadow-md">
                      <i className="fab fa-pinterest-p text-3xl"></i>
                    </div>
                    <span className="text-xs">Pinterest</span>
                  </motion.a>
                </div>
                
                {/* 复制链接 */}
                <div className="mt-5">
                  <div className="relative flex items-center">
                    <input 
                      ref={inputRef}
                      type="text" 
                      value={fullUrl} 
                      readOnly 
                      className="w-full pr-24 py-3 px-4 text-xs italic border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-zinc-800 text-sm text-gray-700 dark:text-gray-200 shadow-inner"
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <motion.button 
                      onClick={copyLink}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`absolute right-1.5 top-1.5 px-3.5 py-1.5 rounded-lg transition-colors shadow-sm ${
                        isCopied 
                          ? 'bg-green-500 text-white' 
                          : 'bg-primary text-white hover:bg-primary-dark'
                      }`}
                    >
                      {isCopied ? (
                        <span className="flex items-center">
                          <i className="fas fa-check mr-1"></i> 已复制
                        </span>
                      ) : (
                        <span className="flex items-center text-xs">
                          <i className="fas fa-copy mr-1"></i> 复制链接
                        </span>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
} 