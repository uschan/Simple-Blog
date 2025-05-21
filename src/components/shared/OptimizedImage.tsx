'use client';

import Image, { ImageProps } from 'next/image';
import { CSSProperties, useMemo } from 'react';
import { convertToApiImageUrl } from '@/lib/utils';

// 扩展ImageProps类型，确保fill和sizes属性
type OptimizedImageProps = ImageProps & {
  // 添加任何额外的属性
  fillSizes?: string;
  unoptimized?: boolean;
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
  ...props
}: OptimizedImageProps) {
  // 当fill为true时，确保设置了sizes属性
  const finalSizes = fill ? (sizes || fillSizes) : sizes;
  
  // 确保style和height:auto配合使用
  const finalStyle: CSSProperties = {
    ...(style || {}),
    ...((!fill && (props.width || props.height)) ? { height: 'auto' } : {})
  };

  // 检测是否为上传的本地文件路径，如果是则设置unoptimized为true
  const isLocalUpload = useMemo(() => {
    if (typeof src === 'string') {
      return src.startsWith('/uploads/') || src.includes('/category-');
    }
    return false;
  }, [src]);

  // 最终的unoptimized属性 - 如果是本地上传的文件，或者明确设置了unoptimized属性
  const finalUnoptimized = propUnoptimized !== undefined ? propUnoptimized : isLocalUpload;
  
  // 使用API路由获取图片
  const finalSrc = useMemo(() => {
    if (typeof src === 'string') {
      return convertToApiImageUrl(src);
    }
    return src;
  }, [src]);
  
  return (
    <Image
      {...props}
      src={finalSrc}
      fill={fill}
      sizes={finalSizes}
      style={finalStyle}
      unoptimized={finalUnoptimized}
    />
  );
} 