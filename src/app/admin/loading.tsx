export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-2 text-text-light">正在加载中...</p>
      </div>
    </div>
  );
} 