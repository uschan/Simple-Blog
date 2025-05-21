"use client";

import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-lg mb-6">您要访问的页面不存在</p>
        <Link href="/admin" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
          返回管理后台
        </Link>
      </div>
    </div>
  );
} 