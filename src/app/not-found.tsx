export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-xl mb-6">页面不存在</h2>
        <a href="/" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
          返回首页
        </a>
      </div>
    </div>
  );
} 