import Image from 'next/image';
import Link from 'next/link';
import EmojiReaction from '@/components/blog/EmojiReaction';
import ViewCounter from '@/components/blog/ViewCounter';
import { getServerApiUrl } from '@/lib/constants';
import { convertToApiImageUrl, extractIconClass } from '@/lib/utils';
import ShareButton from '@/components/blog/ShareButton';
import { getSettings } from '@/lib/api/settings';
import CommentSection from '@/components/blog/CommentSection';
import OptimizedImage from '@/components/shared/OptimizedImage';
import type { Metadata } from "next";

// 导入客户端动态组件
import { GalleryCard } from '@/components/client/DynamicComponents';

// 解析EditorJS内容的函数，但当content为空时使用备用内容(summary或excerpt)
function parseEditorContent(content: string, summary?: string, excerpt?: string) {
  try {
    // 如果内容是空的或不是字符串，使用summary或excerpt
    if (typeof content !== 'string' || content.trim() === '') {
      return summary || excerpt ? `<p>${summary || excerpt}</p>` : '<p>暂无内容</p>';
    }
    
    // 检测内容是否为空的JSON对象或数组，使用summary或excerpt
    if (content.trim() === '{}' || content.trim() === '[]') {
      return summary || excerpt ? `<p>${summary || excerpt}</p>` : '<p>暂无内容</p>';
    }
    
    // 检测内容是否为纯文本(不是JSON格式)
    if (!content.trim().startsWith('{') || !content.includes('"blocks"')) {
      // 如果以{开头但不是有效的EditorJS格式，可能是无效JSON或简单对象
      try {
        const obj = JSON.parse(content);
        // 如果是空对象或没有blocks字段
        if (Object.keys(obj).length === 0 || !obj.blocks) {
          return summary || excerpt ? `<p>${summary || excerpt}</p>` : '<p>暂无内容</p>';
        }
      } catch {
        // JSON解析失败，视为纯文本
        return `<p>${content}</p>`;
      }
    }
    
    // 尝试解析JSON字符串
    const parsed = JSON.parse(content);
    
    // 检查是否是EditorJS格式
    if (parsed && parsed.blocks && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
      let html = '';
      
      // 遍历所有内容块
      parsed.blocks.forEach((block: any) => {
        switch (block.type) {
          case 'paragraph':
            html += `<p>${block.data.text}</p>`;
            break;
          case 'header':
            const headerLevel = block.data.level || 2;
            html += `<h${headerLevel}>${block.data.text}</h${headerLevel}>`;
            break;
          case 'image':
            const caption = block.data.caption ? `<figcaption>${block.data.caption}</figcaption>` : '';
            const imageUrl = convertToApiImageUrl(block.data.file?.url || '');
            html += `
              <figure class="my-4">
                <img src="${imageUrl}" alt="${block.data.caption || ''}" class="w-full" />
                ${caption}
              </figure>
            `;
            break;
          case 'list':
            const listType = block.data.style === 'ordered' ? 'ol' : 'ul';
            let listItems = '';
            block.data.items.forEach((item: string) => {
              listItems += `<li>${item}</li>`;
            });
            html += `<${listType}>${listItems}</${listType}>`;
            break;
          case 'quote':
            html += `<blockquote>${block.data.text}</blockquote>`;
            break;
          case 'delimiter':
            html += '<hr class="my-4" />';
            break;
          case 'code':
            html += `<pre class="text-sm italic bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto"><code>${block.data.code}</code></pre>`;
            break;
          default:
            // 未知块类型，尝试显示文本内容
            if (block.data && block.data.text) {
              html += `<p>${block.data.text}</p>`;
            }
        }
      });
      
      return html || (summary || excerpt ? `<p>${summary || excerpt}</p>` : '<p>暂无内容</p>');
    }
    
    // 如果解析成功但没有有效的blocks，使用summary或excerpt
    return summary || excerpt ? `<p>${summary || excerpt}</p>` : '<p>暂无内容</p>';
  } catch (error) {
    console.error('解析文章内容失败:', error);
    // 解析失败时，如果内容是{}，使用summary或excerpt，否则显示原始内容
    return content.trim() === '{}' ? 
      (summary || excerpt ? `<p>${summary || excerpt}</p>` : '<p>暂无内容</p>') : 
      `<p>${content}</p>`;
  }
}

// 创建安全的图标元素
function createSocialIcon(iconHtml: string): JSX.Element {
  return <i className={extractIconClass(iconHtml)} />;
}

// 定义文章相关接口
interface RelatedArticle {
  excerpt: any;
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  viewCount?: number;
  views?: number;
  coverType?: 'image' | 'gallery' | 'video';
  coverGallery?: string[];
  coverVideo?: string;
  galleryImages?: string[];
  videoUrl?: string;
  date?: string;
  authorName?: string;
  _id?: string; // 同时支持id和_id
  categories?: Array<Category>;
  featuredImage?: string;
  summary?: string;
  likes?: number;
}

interface Author {
  name: string;
  image: string;
  bio: string;
  socials?: Array<{
    name: string;
    url: string;
    icon: string;  // 存储完整的HTML图标代码
  }>;
}

interface Category {
  _id: string;
  name: string;
  slug?: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  date: string;
  category: string;
  categorySlug: string;
  views: number;
  coverImage: string;
  coverType?: 'image' | 'gallery' | 'video';
  coverGallery?: string[];
  coverVideo?: string;
  galleryImages?: string[];
  videoUrl?: string;
  author: Author;
  tags: string[];
  relatedArticles: RelatedArticle[];
  categories?: Category[];
  summary?: string;
  excerpt?: string; // 添加excerpt字段以兼容前端组件
}

// 获取文章数据
async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    // console.log(`正在获取文章: ${slug}`);
    const response = await fetch(getServerApiUrl(`/api/articles/${slug}`), {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error(`获取文章失败: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.data) {
      console.error('API未返回预期的文章数据:', data);
      return null;
    }
    
    // 处理相关文章数据，确保字段名和格式正确
    if (data.data.relatedArticles && Array.isArray(data.data.relatedArticles)) {
      // 输出调试信息
      // console.log('原始相关文章数据:', JSON.stringify(data.data.relatedArticles[0], null, 2));
      
      data.data.relatedArticles = data.data.relatedArticles.map((related: any) => {
        // 确保数据结构完整
        return {
          ...related,
          id: related.id || related._id,
          _id: related._id || related.id,
          viewCount: related.views || 0,
          views: related.views || 0,
          coverType: related.coverType || 'image',
          // 确保多媒体字段存在
          galleryImages: related.galleryImages || [],
          coverGallery: related.coverGallery || [],
          videoUrl: related.videoUrl || '',
          coverVideo: related.coverVideo || '',
          // 添加其他可能缺失的字段
          featuredImage: related.featuredImage || related.coverImage || '',
          summary: related.summary || related.excerpt || ''
        };
      });
      
      // 输出调试信息
      // console.log('处理后相关文章数据:', JSON.stringify(data.data.relatedArticles[0], null, 2));
    }
    
    // console.log(`成功获取文章: ${data.data.title}`);
    return data.data;
  } catch (error) {
    console.error('获取文章错误:', error);
    return null;
  }
}

// 生成动态元数据
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  // 获取网站设置
  const settings = await getSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // 获取文章信息
  const article = await getArticleBySlug(slug);
  
  // 如果文章不存在，返回默认元数据
  if (!article) {
    return {
      title: `文章未找到 | ${settings.siteName}`,
      description: settings.siteDescription,
    };
  }
  
  // 从文章中提取描述（优先使用summary，然后是excerpt，最后是内容的前150个字符）
  let description = '';
  if (article.summary) {
    description = article.summary;
  } else if (article.excerpt) {
    description = article.excerpt;
  } else if (article.content) {
    try {
      // 定义EditorJS块的类型
      interface EditorJSBlock {
        type: string;
        data: {
          text?: string;
          [key: string]: any;
        };
      }
      
      // 尝试解析JSON内容，获取第一个段落
      const contentObj = JSON.parse(article.content);
      if (contentObj && contentObj.blocks && Array.isArray(contentObj.blocks)) {
        // 查找第一个段落块
        const firstParagraph = contentObj.blocks.find((block: EditorJSBlock) => block.type === 'paragraph');
        if (firstParagraph && firstParagraph.data && firstParagraph.data.text) {
          const plainText = firstParagraph.data.text.replace(/<[^>]*>/g, '');
          description = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
        } else {
          // 如果没有找到段落，使用任意块的文本
          for (const block of contentObj.blocks as EditorJSBlock[]) {
            if (block && block.data && block.data.text) {
              const plainText = String(block.data.text).replace(/<[^>]*>/g, '');
              description = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
              break;
            }
          }
        }
      }
    } catch (e) {
      // JSON解析失败，直接从内容中提取纯文本
      const plainText = article.content.replace(/<[^>]*>/g, '');
      description = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
    }
    
    // 如果上述处理后仍然没有描述，使用原始的处理方法
    if (!description) {
      const plainText = article.content.replace(/<[^>]*>/g, '');
      description = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
    }
  } else {
    description = settings.siteDescription;
  }
  
  // 获取文章分类名称（如果有）
  const categoryName = article.categories && article.categories.length > 0 
    ? article.categories[0].name 
    : article.category || '';
  
  // 构建带分类的标题，不包含网站名称（网站名称由根布局添加）
  const titleWithCategory = categoryName 
    ? `${article.title} - ${categoryName}` 
    : article.title;
  
  // 准备关键词（使用文章标签，如果没有则使用网站默认关键词）
  const keywords = article.tags && article.tags.length > 0 
    ? article.tags.join(',') 
    : settings.siteKeywords;
    
  // 获取文章的主图片，用于社交媒体卡片
  let mainImage = article.coverImage || settings.logo;
  
  // 如果没有封面图，尝试从内容中提取第一张图片
  if (!article.coverImage && article.content) {
    try {
      const contentObj = JSON.parse(article.content);
      if (contentObj && contentObj.blocks && Array.isArray(contentObj.blocks)) {
        // 查找第一个图片块
        const firstImageBlock = contentObj.blocks.find((block: any) => block.type === 'image');
        if (firstImageBlock && firstImageBlock.data && firstImageBlock.data.file && firstImageBlock.data.file.url) {
          mainImage = firstImageBlock.data.file.url;
        }
      }
    } catch (e) {
      // 解析失败，保持默认图片
    }
  }
  
  // 确保主图URL正确处理
  mainImage = convertToApiImageUrl(mainImage);

  return {
    title: titleWithCategory,
    description: description,
    keywords: keywords,
    openGraph: {
      title: `${titleWithCategory} | ${settings.siteName}`, // OpenGraph需要完整标题
      description: description,
      type: 'article',
      url: `${siteUrl}/article/${slug}`,
      images: [
        {
          url: mainImage,
          width: 1200,
          height: 630,
          alt: article.title,
        }
      ],
      publishedTime: article.date,
      authors: [article.author?.name || '匿名作者'],
      section: categoryName,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titleWithCategory} | ${settings.siteName}`, // Twitter需要完整标题
      description: description,
      images: [mainImage],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const article = await getArticleBySlug(slug);
  // 获取系统设置，包括社交媒体配置
  const settings = await getSettings();
  
  // 如果没有找到文章，显示错误信息
  if (!article) {
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-3xl font-bold mb-4">文章不存在</h1>
          <p className="mb-6">抱歉，您请求的文章不存在或已被移除。</p>
          <Link href="/" className="bg-primary text-white px-4 py-2 rounded-lg">
            返回首页
          </Link>
              </div>
            </div>
    );
  }
  
  // 准备表情反应组件所需数据
  const articleWithReactions = {
    id: article.id,
    reactionCount: 0, // 这里可以从文章数据中获取，或者从单独的API获取
    userReaction: undefined // 用户的反应需要根据用户状态来获取
  };
  
  // 根据封面类型准备不同的视图
  let coverSection;
  switch (article.coverType) {
    case 'gallery':
      // 处理画廊封面 - 使用GalleryCard组件
      coverSection = (
        <GalleryCard 
          images={
            article.galleryImages?.length ? article.galleryImages.map(img => convertToApiImageUrl(img)) :
            article.coverGallery?.length ? article.coverGallery.map(img => convertToApiImageUrl(img)) :
            article.coverImage ? [convertToApiImageUrl(article.coverImage)] : []
          }
          title={article.title}
          category={article.categories?.length ? article.categories[0] : undefined}
        />
      );
      break;
    case 'video':
      // 处理视频封面 - 与首页保持一致
      coverSection = (
        <div className="relative">
          <video 
            src={convertToApiImageUrl(article.videoUrl || article.coverVideo || '')} 
            preload="metadata"
            controls
            className="w-full object-cover bg-gray-100"
          />
          {/* 视频标识 */}
          <div className="absolute bottom-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
            <i className="fas fa-video mr-1"></i>
            视频
          </div>
          {/* 分类标签 */}
          <div className="absolute top-2.5 left-2.5 flex space-x-2 z-20">
            {article.categories?.length ? (
              article.categories.map((cat: Category) => (
                <span key={cat._id} className="bg-primary/90 text-white px-3 py-1.5 text-xs font-medium rounded-full border border-white/20 shadow-md backdrop-blur-sm">
                  {cat.name}
                </span>
              ))
            ) : (
              article.category && (
                <span className="bg-primary/90 text-white px-3 py-1.5 text-xs font-medium rounded-full border border-white/20 shadow-md backdrop-blur-sm">
                  {article.category}
                </span>
              )
            )}
          </div>
        </div>
      );
      break;
    default:
      // 默认图片封面
      coverSection = article.coverImage ? (
        <div className="relative">
          <Image
            src={convertToApiImageUrl(article.coverImage)} 
            alt={article.title}
            width={0}
            height={0}
            sizes="100vw"
            className="w-full h-auto"
            priority
          />
          {/* 分类标签 */}
          <div className="absolute top-2.5 left-2.5 flex space-x-2 z-20">
            {article.categories?.length ? (
              article.categories.map((cat: Category) => (
                <span key={cat._id} className="bg-primary/90 text-white px-3 py-1.5 text-xs font-medium rounded-full border border-white/20 shadow-md backdrop-blur-sm">
                  {cat.name}
                </span>
              ))
            ) : (
              article.category && (
                <span className="bg-primary/90 text-white px-3 py-1.5 text-xs font-medium rounded-full border border-white/20 shadow-md backdrop-blur-sm">
                  {article.category}
                </span>
              )
            )}
          </div>
        </div>
      ) : null;
  }
  
  return (
    <main className="container mx-auto p-4">
      {/* 返回链接 */}
      <div className="flex text-sm items-center mb-2  pb-2">     
        <div className="flex items-center mr-2 text-lg font-medium underline underline-offset-8 decoration-wavy">
          <i className="fa-solid fa-umbrella-beach mr-1"></i>
          <Link href="/" className="flex items-center hover:text-primary">
            <span>返回首页</span>
          </Link>
        </div>
        <div className="flex items-center text-lg text-text-light font-medium underline underline-offset-8 decoration-wavy">
          <i className="fa-duotone fa-solid fa-angles-right mr-1"></i>
            {article.categories?.length ? (
              article.categories.map((cat: Category) => (
                <span key={cat._id}>
                  {cat.name}
                </span>
              ))
            ) : (
              article.category && (
                <span>
                  {article.category}
                </span>
              )
            )}
        </div>
      </div>

      {/* 文章主体内容区域 - 左右两栏布局 */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 左侧 - 文章内容 */}
        <div className="lg:w-2/3">
          {/* 文章头部信息卡片 */}
          <div className="bg-bg-card rounded-lg overflow-hidden shadow-sm mb-8 border border-gray-200">
            <div className="flex flex-col">
              {/* 文章封面图 */}
              {coverSection}
              
              {/* 文章标题和作者信息 */}
              <div className="p-4">
                <h1 className="text-xl font-medium mb-2">{article.title}</h1>
                
                <div className="flex text-sm items-center mb-4 border-b border-gray-200 pb-2">
                  <div className="flex items-center mr-6">
                    <i className="fa-solid fa-user-astronaut mr-2 text-primary"></i>
                    <span>{article.author?.name || '匿名作者'}</span>
                  </div>
                  <div className="flex items-center text-text-light">
                    <i className="fa-solid fa-calendar-days mr-2"></i>
                    <span>{article.date || '未知日期'}</span>
                  </div>
        </div>
        
                {/* 摘要区替代为文章内容区 */}
                <div className="mb-6">
        <div 
                    className="article-content prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: parseEditorContent(article.content, article.summary, (article as any).excerpt) }}
        />
                </div>
        
                {/* 分享和互动区域 */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
            <EmojiReaction article={articleWithReactions} />
          </div>
                    <div className="flex items-center text-sm text-text-light space-x-4">
            <ViewCounter 
              articleId={article.id} 
              initialCount={article.views || 0}
              className="inline-flex"
            />
                      <ShareButton 
                        url={`/article/${article.slug}`} 
                        title={article.title}
                        summary={article.content.replace(/<[^>]*>/g, '').substring(0, 100)}
                      />
          </div>
        </div>
          </div>
        </div>
            </div>
          </div>
          
          {/* 评论区 */}
          <CommentSection articleId={article.id} />
        </div>
        
        {/* 右侧 - 作者信息和推荐阅读 */}
        <div className="lg:w-1/3">
          {/* 作者信息卡片 */}
          {article.author && (
            <div className="bg-bg-card rounded-lg overflow-hidden shadow-sm mb-4 border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-16 h-16 relative rounded-full overflow-hidden mr-4">
                  <Image
                    src="/images/avatar.png"
                    alt={article.author.name || '匿名作者'}
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{article.author.name || '匿名作者'}</h3>
                    <span className="text-text-light text-xs">@wildsalt.me</span>
                  </div>
                  
                  {/* 社交媒体链接 - 只显示图标 */}
                  <div className="mt-2 flex items-center space-x-3">
                    {article.author.socials && article.author.socials.length > 0 ? (
                      article.author.socials.map((social, index) => (
                        <a 
                          key={index}
                          href={social.url} 
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.name}
                          className="text-text-light hover:text-primary text-lg"
                        >
                          {createSocialIcon(social.icon)}
                        </a>
                      ))
                    ) : settings.socials && settings.socials.length > 0 ? (
                      settings.socials.map((social, index) => (
                        <a 
                          key={index}
                          href={social.url} 
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.name}
                          className="text-text-light hover:text-primary text-lg"
                        >
                          {createSocialIcon(social.icon)}
                        </a>
                      ))
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 推荐阅读 - 相关文章 */}
          {article.relatedArticles && article.relatedArticles.length > 0 && (
            <div className="mb-8">
              <h2 className="px-4 py-2 text-lg font-medium underline underline-offset-8 decoration-sky-500 decoration-wavy rounded-lg mb-4 flex items-center">
              <i className="fa-regular fa-face-kiss-wink-heart text-3xl text-sky-500 mr-3"></i>
                推荐阅读
              </h2>
              <div className="space-y-6">
                {article.relatedArticles.map((related: RelatedArticle) => (
                  <div key={related.id} className="text-sm bg-bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                    <div className="relative">
                      {/* 根据coverType显示不同类型的媒体 */}
                      {related.coverType === 'video' ? (
                        // 视频类型
                        <div className="relative">
                          <video 
                            src={convertToApiImageUrl(related.videoUrl || related.coverVideo || '')} 
                            preload="metadata"
                            controls
                            className="w-full h-[250px] object-cover bg-gray-100"
                          />
                          {/* 视频标识 */}
                          <div className="absolute bottom-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                            <i className="fas fa-video mr-1"></i>
                            视频
                          </div>
                          {/* 分类标签 */}
                          <div className="absolute top-2.5 left-2.5 flex space-x-2 z-20">
                            {related.categories?.length ? (
                              related.categories.map((cat: Category) => (
                                <span key={cat._id} className="bg-primary/90 text-white px-3 py-1.5 text-xs font-medium rounded-full border border-white/20 shadow-md backdrop-blur-sm">
                                  {cat.name}
                                </span>
                              ))
                            ) : null}
                          </div>
                        </div>
                      ) : related.coverType === 'gallery' ? (
                        // 多图类型 - 使用轮播组件
                        <GalleryCard 
                          images={
                            related.galleryImages?.length ? related.galleryImages.map(img => convertToApiImageUrl(img)) :
                            related.coverGallery?.length ? related.coverGallery.map(img => convertToApiImageUrl(img)) :
                            related.featuredImage || related.coverImage ? [convertToApiImageUrl(related.featuredImage || related.coverImage || '')] : []
                          }
                          title={related.title}
                          category={related.categories?.length ? related.categories[0] : undefined}
                        />
                      ) : (
                        // 默认单图类型
                        <div className="relative">
                          {related.featuredImage || related.coverImage ? (
                            <Link href={`/article/${related.slug}`}>
                            <OptimizedImage 
                              src={convertToApiImageUrl(related.featuredImage || related.coverImage || '')} 
                              alt={related.title}
                              width={400}
                              height={250}
                              className="w-full"
                            />
                            </Link>
                          ) : (
                            <div className="w-full h-[250px] bg-gray-200 flex items-center justify-center">
                              <i className="fas fa-file-alt text-gray-400 text-3xl"></i>
                            </div>
                          )}
                          {/* 分类标签 */}
                          <div className="absolute top-2.5 left-2.5 flex space-x-2 z-20">
                            {related.categories?.length ? (
                              related.categories.map((cat: Category) => (
                                <span key={cat._id} className="bg-primary/90 text-white px-3 py-1.5 text-xs font-medium rounded-full border border-white/20 shadow-md backdrop-blur-sm">
                                  {cat.name}
                                </span>
                              ))
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="px-4 py-2">
                      <Link href={`/article/${related.slug}`}>
                        <h3 className="text-xl font-bold text-primary mb-2">{related.title}</h3>
                      </Link>                      
                      <div className="flex items-center mb-2">
                        <i className="fa-solid fa-user-astronaut mr-1"></i>
                        <span className="text-xs text-text-light">
                          {related.authorName || article.author?.name || '匿名'} | {related.date || article.date || '未知日期'}
                        </span>
                      </div>

                      <p className="text-text-light mb-4">{related.excerpt || related.summary}</p>
                      <div className="border-t border-gray-200 my-2"></div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <EmojiReaction 
                            article={{
                              id: related.id || related._id || '',
                              reactionCount: related.likes || 0,
                              userReaction: 'like'
                            }}
                          />
                        </div>
                        <div className="flex items-center text-sm text-text-light space-x-4">
                          <div className="flex items-center">
                            <i className="fa-solid fa-eye mr-1"></i>
                            <span>{related.viewCount || related.views || 0}</span>
                          </div>
                          <ShareButton 
                            url={`/article/${related.slug}`} 
                            title={related.title}
                            summary={related.excerpt || related.summary || ''}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 