// components/AnalyticsInjector.tsx
'use client'
import { useEffect } from 'react'

interface AnalyticsInjectorProps {
  trackingCode: string
}

export default function AnalyticsInjector({ trackingCode }: AnalyticsInjectorProps) {
  useEffect(() => {
    if (!trackingCode) return

    const container = document.createElement('div')
    container.innerHTML = trackingCode
    
    const scripts = container.querySelectorAll('script')
    
    scripts.forEach(originalScript => {
      const newScript = document.createElement('script')
      
      Array.from(originalScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value)
      })
      
      if (originalScript.src) {
        newScript.src = originalScript.src
      } else if (originalScript.textContent) {
        newScript.textContent = originalScript.textContent
      }
      
      document.body.appendChild(newScript)
    })
  }, [trackingCode])

  return null
}