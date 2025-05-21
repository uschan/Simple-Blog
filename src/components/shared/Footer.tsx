'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSettings, type SiteSettings } from '@/lib/api/settings';
import { extractIconClass } from '@/lib/utils';

interface FooterProps {
  initialCopyright: string;
  initialSocials: SiteSettings['socials'];
}

export default function Footer({ initialCopyright, initialSocials }: FooterProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // 创建安全的图标元素
  const createSocialIcon = (iconHtml: string) => {
    return <i className={extractIconClass(iconHtml)} />;
  };

  return (
    <footer className="bg-bg-card text-sm py-4 mt-4 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p>{initialCopyright}</p>
          <div className="mt-2 md:mt-0">
            {mounted && initialSocials && initialSocials.map((social, index) => (
              <a 
                key={index}
                href={social.url} 
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="text-text-light hover:text-primary mr-4 last:mr-0"
              >
                {createSocialIcon(social.icon)}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
} 