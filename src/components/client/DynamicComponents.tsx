'use client';

import dynamic from 'next/dynamic';

// 动态导入客户端组件
export const GalleryCard = dynamic(() => import('@/components/blog/GalleryCard'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] bg-gray-200 animate-pulse flex items-center justify-center">
      <i className="fas fa-images text-gray-400 text-3xl"></i>
    </div>
  )
});

// 动态导入轮播组件
export const HeroSlider = dynamic(() => import('@/components/blog/HeroSlider'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-96 bg-gradient-to-b from-gray-300 to-gray-500 mb-8 rounded-lg overflow-hidden flex items-center justify-center animate-pulse">
      <i className="fas fa-spinner fa-spin text-white text-3xl"></i>
    </div>
  )
}); 