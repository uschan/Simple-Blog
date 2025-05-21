'use client';

import { useState } from 'react';
import SharePopup from './SharePopup';

interface ShareButtonProps {
  url: string;
  title: string;
  summary?: string;
  className?: string;
}

export default function ShareButton({ url, title, summary, className = '' }: ShareButtonProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
  return (
    <>
      <button 
        onClick={() => setIsPopupOpen(true)}
        className={`text-text-light hover:text-primary transition-colors focus:outline-none ${className}`}
        aria-label="分享文章"
      >
        <i className="fa-solid fa-share-nodes"></i>
      </button>
      
      <SharePopup 
        url={url}
        title={title}
        summary={summary}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </>
  );
} 