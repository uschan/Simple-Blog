"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录错误到错误报告服务
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">出错了</h1>
        <p className="mb-6 text-text-light">
          {error.message || "发生了未知错误，请稍后重试。"}
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={reset}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            重试
          </button>
          <Link href="/admin" className="bg-gray-200 dark:bg-gray-700 text-text px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            返回管理后台
          </Link>
        </div>
      </div>
    </div>
  );
} 