"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface BaseUrlContextType {
  windowOrigin: string;
}

// 创建上下文
const BaseUrlContext = createContext<BaseUrlContextType>({
  windowOrigin: ''
});

// 提供一个钩子来使用上下文
export const useBaseUrl = () => useContext(BaseUrlContext);

interface BaseUrlProviderProps {
  children: ReactNode;
}

export const BaseUrlProvider: React.FC<BaseUrlProviderProps> = ({ children }) => {
  const [windowOrigin, setWindowOrigin] = useState<string>('');

  useEffect(() => {
    // 在客户端获取当前窗口的origin
    if (typeof window !== 'undefined') {
      setWindowOrigin(window.location.origin);
    }
  }, []);

  return (
    <BaseUrlContext.Provider value={{ windowOrigin }}>
      {children}
    </BaseUrlContext.Provider>
  );
};

export default BaseUrlContext; 