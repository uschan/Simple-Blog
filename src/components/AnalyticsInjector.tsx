// components/AnalyticsInjector.tsx
'use client'
import Script from 'next/script'

interface AnalyticsInjectorProps {
  trackingCode: string
}

export default function AnalyticsInjector({ trackingCode }: AnalyticsInjectorProps) {
  if (!trackingCode) return null
  
  // 创建一个唯一ID以避免冲突
  const scriptId = `analytics-script-${Math.random().toString(36).substring(2, 9)}`
  
  // 使用Next.js的Script组件而不是手动操作DOM
  return (
    <Script
      id={scriptId}
      dangerouslySetInnerHTML={{ __html: trackingCode }}
      strategy="afterInteractive"
    />
  )
}