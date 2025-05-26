'use client';

import Image, { ImageProps } from 'next/image';
import { CSSProperties, useMemo } from 'react';
import { convertToApiImageUrl, getOptimizedImageUrl } from '@/lib/utils';

// 扩展ImageProps类型，确保fill和sizes属性
type OptimizedImageProps = ImageProps & {
  // 添加任何额外的属性
  fillSizes?: string;
  unoptimized?: boolean;
  quality?: number;
  priority?: boolean;
  optimizeImage?: boolean; // 是否使用优化API
  imageFormat?: 'webp' | 'jpeg' | 'png' | 'avif'; // 图片格式选项
};

/**
 * 优化的Image组件，自动处理fill模式下的sizes属性
 * 当使用fill=true时，如果没有提供sizes，会使用默认的sizes值
 */
export default function OptimizedImage({
  fillSizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fill,
  sizes,
  style,
  src,
  unoptimized: propUnoptimized,
  quality = 75, // 默认质量为75%
  priority = false,
  optimizeImage = true, // 默认启用图片优化
  imageFormat = 'webp', // 默认使用webp格式
  width: propWidth,
  ...props
}: OptimizedImageProps) {
  // 当fill为true时，确保设置了sizes属性
  const finalSizes = fill ? (sizes || fillSizes) : sizes;
  
  // 确保style和height:auto配合使用
  const finalStyle: CSSProperties = {
    ...(style || {}),
    ...((!fill && (propWidth || props.height)) ? { height: 'auto' } : {})
  };

  // 检测是否为上传的本地文件路径，如果是则设置unoptimized为true
  const isLocalUpload = useMemo(() => {
    if (typeof src === 'string') {
      return src.startsWith('/uploads/') || src.includes('/category-');
    }
    return false;
  }, [src]);

  // 最终的unoptimized属性 - 如果是本地上传的文件，或者明确设置了unoptimized属性
  const finalUnoptimized = propUnoptimized !== undefined ? propUnoptimized : false;
  
  // 计算适当的图片宽度 - 用于优化
  const optimalWidth = useMemo(() => {
    if (typeof propWidth === 'number') {
      // 如果有明确的宽度，使用这个宽度的2倍（处理高DPI屏幕）
      return Math.min(propWidth * 2, 1200);
    }
    // 否则使用合理的默认值
    return fill ? 1200 : 800;
  }, [propWidth, fill]);
  
  // 使用API路由获取图片或优化的图片
  const finalSrc = useMemo(() => {
    if (typeof src === 'string') {
      // 检查是否应该优化图片
      if (optimizeImage && !src.startsWith('http')) {
        // 使用优化API
        return getOptimizedImageUrl(src, {
          width: optimalWidth,
          format: imageFormat,
          quality
        });
      }
      // 使用常规API
      return convertToApiImageUrl(src);
    }
    return src;
  }, [src, optimizeImage, optimalWidth, imageFormat, quality]);
  
  return (
    <Image
      {...props}
      src={finalSrc}
      fill={fill}
      sizes={finalSizes}
      style={finalStyle}
      unoptimized={finalUnoptimized}
      quality={quality}
      loading={priority ? "eager" : "lazy"}
      priority={priority}
      width={propWidth}
    />
  );
} 