import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: '野盐博客 - 现代化的AI驱动内容创作平台',
  description: '野盐博客是一个现代化的AI驱动内容创作与分享平台，特别为追求独立创作空间的内容创作者打造',
};

export default function IntroPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 顶部横幅 */}
      <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl overflow-hidden mb-12">
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2760%27%20height%3D%2760%27%20viewBox%3D%270%200%2060%2060%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cg%20fill%3D%27none%27%20fill-rule%3D%27evenodd%27%3E%3Cg%20fill%3D%27%23ffffff%27%20fill-opacity%3D%270.2%27%3E%3Cpath%20d%3D%27M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%27%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
        <div className="relative z-10 py-8 px-8 text-white text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">野盐博客系统</h1>
          <p className="text-base md:text-2xl font-light max-w-3xl mx-auto">
            现代化的AI驱动内容创作与分享平台
          </p>
          <p className="text-sm md:text-lg italic mt-4 text-blue-100">
            为追求独立创作空间的内容创作者打造
          </p>
        </div>
      </div>

      {/* 项目统计 */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-6  mb-6">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 text-center transition-transform hover:-translate-y-1 duration-300">
          <div className="text-lg md:text-4xl font-bold text-blue-500 mb-2">145</div>
          <div className="text-gray-600 dark:text-gray-400 text-xs md:text-lg font-medium">源代码文件</div>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 text-center transition-transform hover:-translate-y-1 duration-300">
          <div className="text-lg md:text-4xl font-bold text-blue-500 mb-2">19,733</div>
          <div className="text-gray-600 dark:text-gray-400 text-xs md:text-lg  font-medium">行代码</div>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 text-center transition-transform hover:-translate-y-1 duration-300">
          <div className="text-lg md:text-4xl font-bold text-blue-500 mb-2">24,996</div>
          <div className="text-gray-600 dark:text-gray-400 text-xs md:text-lg  font-medium">总项目规模</div>
        </div>
      </div>

      {/* 核心特色 */}
      <h2 className="text-2xl font-bold mb-4 text-center">🌟 核心特色</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8  mb-6">
        <div className="bg-blue-50 dark:bg-zinc-800 rounded-lg p-6 border-l-4 border-blue-500">
          <h3 className="flex items-center text-base font-semibold text-blue-800 mb-4">
            <span className="text-2xl mr-2">🤖</span> AI驱动创作
          </h3>
          <ul className="space-y-2  text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Deepseek AI深度集成，智能协助内容创作</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
              <span>未来接入ChatGPT、Gemini、Grok3、Sora等AI模型</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
              <span>AI辅助图片创意生成，提供独特视觉元素</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
              <span>智能写作建议和内容优化，创作更轻松</span>
            </li>
          </ul>
        </div>

        <div className="bg-green-50 dark:bg-zinc-800 rounded-lg p-6 border-l-4 border-green-500">
          <h3 className="flex items-center text-base font-semibold text-green-800 mb-4">
            <span className="text-2xl mr-2">🚀</span> 技术先进
          </h3>
          <ul className="space-y-2  text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-green-500 dark:text-green-400 mr-2">•</span>
              <span>基于Next.js 14的App Router架构</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 dark:text-green-400 mr-2">•</span>
              <span>TypeScript全面类型支持，确保代码质量</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 dark:text-green-400 mr-2">•</span>
              <span>Tailwind CSS构建现代化响应式UI</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 dark:text-green-400 mr-2">•</span>
              <span>MongoDB灵活存储各类内容</span>
            </li>
          </ul>
        </div>

        <div className="bg-amber-50 dark:bg-zinc-800 rounded-lg p-6 border-l-4 border-amber-500">
          <h3 className="flex items-center text-base font-semibold text-amber-800 mb-4">
            <span className="text-2xl mr-2">🎨</span> 精美设计
          </h3>
          <ul className="space-y-2  text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-amber-500 dark:text-amber-400 mr-2">•</span>
              <span>精心设计的响应式界面，完美适配各种设备</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 dark:text-amber-400 mr-2">•</span>
              <span>优雅的暗色/亮色模式切换</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 dark:text-amber-400 mr-2">•</span>
              <span>动态组件加载和平滑过渡动画</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 dark:text-amber-400 mr-2">•</span>
              <span>精美的卡片式布局和视觉层次结构</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 dark:bg-zinc-800 rounded-lg p-6 border-l-4 border-blue-500">
          <h3 className="flex items-center text-base font-semibold text-blue-800 mb-4">
            <span className="text-2xl mr-2">💬</span> 互动体验
          </h3>
          <ul className="space-y-2  text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
              <span>创新的表情反应系统，支持多种情感表达</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
              <span>完善的评论系统，促进用户互动</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
              <span>社交分享功能，一键分享精彩内容</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
              <span>文章阅读量统计和热门内容推荐</span>
            </li>
          </ul>
        </div>

        <div className="bg-red-50 dark:bg-zinc-800 rounded-lg p-6 border-l-4 border-red-500">
          <h3 className="flex items-center text-base font-semibold text-red-800 mb-4">
            <span className="text-2xl mr-2">📱</span> 移动优先
          </h3>
          <ul className="space-y-2  text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-red-500 dark:text-red-400 mr-2">•</span>
              <span>触摸优化的交互体验，支持滑动和手势操作</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 dark:text-red-400 mr-2">•</span>
              <span>自适应布局，在不同屏幕尺寸下呈现最佳效果</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 dark:text-red-400 mr-2">•</span>
              <span>优化的图片加载策略，节省移动设备流量</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 dark:text-red-400 mr-2">•</span>
              <span>快速响应的界面设计，提升移动端体验</span>
            </li>
          </ul>
        </div>

        <div className="bg-purple-50 dark:bg-zinc-800 rounded-lg p-6 border-l-4 border-purple-500">
          <h3 className="flex items-center text-base font-semibold text-purple-800 mb-4">
            <span className="text-2xl mr-2">🌟</span> 开源与个性化
          </h3>
          <ul className="space-y-2  text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-purple-500 dark:text-purple-400 mr-2">•</span>
              <span>完全开源项目，可自由定制和扩展</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 dark:text-purple-400 mr-2">•</span>
              <span>特别适合追求独立创作空间的内向型创作者</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 dark:text-purple-400 mr-2">•</span>
              <span>远离新媒体平台的嘈杂环境，专注于内容本身</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 dark:text-purple-400 mr-2">•</span>
              <span>支持个性化定制，打造属于自己的创作空间</span>
            </li>
          </ul>
        </div>
      </div>

      {/* AI创作助手 */}
      <h2 className="text-2xl font-bold mb-4 text-center">🤖 AI创作助手</h2>
      <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-8  mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
          <div>
            <h3 className="text-base font-semibold text-primary border-b-2 border-blue-500 pb-2 mb-4 inline-block">
              智能写作面板
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              集成Deepseek AI，一键获取创作灵感和内容建议。只需提供简单提示，AI即可协助您完成创作构思、大纲规划和内容扩展。
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-primary border-b-2 border-blue-500 pb-2 mb-4 inline-block">
              AI图像生成
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              为文章配图提供创意支持，无需专业设计技能。描述您想要的图片风格和内容，AI即可生成符合您需求的独特视觉元素。
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
          <div>
            <h3 className="text-base font-semibold text-primary border-b-2 border-blue-500 pb-2 mb-4 inline-block">
              智能内容优化
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              提供语法修正、表达优化和SEO建议，提升文章质量。分析您的内容，给出针对性的改进建议，让您的文章更专业、更有吸引力。
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-primary border-b-2 border-blue-500 pb-2 mb-4 inline-block">
              草稿智能完善
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              帮助克服创作瓶颈，完善半成品内容。当您陷入创作困境时，AI助手可以根据已有内容提供合理的延续和完善建议。
            </p>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-zinc-800 border-l-4 border-blue-500 p-4 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-400">
            🚀 未来计划：接入更多AI模型（ChatGPT、Gemini、Grok3、Sora等），提供更丰富的AI创作体验和视频内容生成能力。
          </p>
        </div>
      </div>

      {/* 为什么选择野盐博客 */}
      <h2 className="text-2xl font-bold mb-4 text-center">💡 为什么选择野盐博客？</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6  mb-6">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 flex flex-col transition-transform hover:-translate-y-1 duration-300">
          <div className="text-blue-500 text-3xl mb-4">✨</div>
          <h3 className="text-base font-semibold text-primary mb-3">远离喧嚣，专注创作</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 flex-grow">
            为内向型创作者打造安静独立的创作空间，远离新媒体平台的嘈杂环境，让您能够专注于真正有价值的内容创作。
          </p>
        </div>
        
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 flex flex-col transition-transform hover:-translate-y-1 duration-300">
          <div className="text-blue-500 text-3xl mb-4">🔐</div>
          <h3 className="text-base font-semibold text-primary mb-3">完全掌控您的内容</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 flex-grow">
            作为开源项目，您拥有对平台的完全控制权，不受第三方平台规则限制，内容永远属于您自己，不会被随意删除或限流。
          </p>
        </div>
        
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 flex flex-col transition-transform hover:-translate-y-1 duration-300">
          <div className="text-blue-500 text-3xl mb-4">🧠</div>
          <h3 className="text-base font-semibold text-primary mb-3">AI增强创作能力</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 flex-grow">
            Deepseek AI深度集成，帮助您克服创作瓶颈，提升内容质量。未来将接入更多AI模型，持续增强您的创作体验。
          </p>
        </div>
        
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 flex flex-col transition-transform hover:-translate-y-1 duration-300">
          <div className="text-blue-500 text-3xl mb-4">🎯</div>
          <h3 className="text-base font-semibold text-primary mb-3">打造个人品牌</h3>
          <p className="text-sm text-gray-700 dark:text-gray-100 flex-grow">
            通过独立博客建立您的个人品牌和专业形象，展示您的专业知识和独特见解，为职业发展和个人影响力打下基础。
          </p>
        </div>
      </div>

      {/* 底部行动号召 */}
      <div className="text-center p-6 mb-4 bg-gray-50 dark:bg-zinc-800 rounded-xl">
        <h2 className="text-2xl font-bold mb-4 text-primary dark:text-white">开启您的内容创作之旅</h2>
        <p className="text-primary max-w-2xl mx-auto mb-4">
          野盐博客系统不仅是一个展示内容的平台，更是一个连接创作者与读者的桥梁。通过AI驱动的创作体验和精美的设计，让您的内容创作更加轻松高效。
        </p>
        <div className="flex justify-center space-x-4 flex-wrap">
          <Link href="mailto:loading@gmail.com" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium transition-colors">
            立即开始使用
          </Link>
          <a href="https://github.com/uschan/Simple-Blog" target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-gray-100 text-blue-500 border border-blue-500 px-6 py-3 rounded-md font-medium transition-colors">
            查看开源代码
          </a>
        </div>
      </div>

      {/* 页脚 */}
      <div className="text-center py-8 text-gray-500">
        野盐博客系统 V1.0 | 由Next.js和AI技术驱动
      </div>
    </div>
  );
} 