import Image from 'next/image';
import OptimizedImage from '@/components/shared/OptimizedImage';
import Link from 'next/link';
import { convertToApiImageUrl } from '@/lib/utils';

type ArticleCardProps = {
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  date: string;
  category?: string;
  categorySlug?: string;
  author: {
    name: string;
    image?: string;
  };
};

export default function ArticleCard({
  title,
  slug,
  excerpt,
  coverImage,
  date,
  category,
  categorySlug,
  author,
}: ArticleCardProps) {
  return (
    <div className="card overflow-hidden flex flex-col border border-gray-200">
      {coverImage ? (
        <div className="relative h-48 w-full">
          <Link href={`/article/${slug}`} className="block">
            <OptimizedImage
              src={convertToApiImageUrl(coverImage)}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>
      ) : (
        <div className="relative h-48 w-full bg-gray-200 flex items-center justify-center">
          <i className="fas fa-file-alt text-gray-400 text-3xl"></i>
        </div>
      )}
      <div className="flex-grow p-4">
        {category && (
          <Link 
            href={`/category/${categorySlug || category.toLowerCase()}`}
            className="inline-block bg-primary text-white text-xs px-2 py-1 rounded mb-2"
          >
            {category}
          </Link>
        )}
        <Link href={`/article/${slug}`}>
          <h2 className="text-lg font-semibold mb-2 hover:text-primary line-clamp-2">{title}</h2>
        </Link>
        <p className="text-text-light mb-4 line-clamp-3 text-sm">{excerpt}</p>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center">
            {author.image ? (
              <OptimizedImage
                src={convertToApiImageUrl(author.image)}
                alt={author.name}
                width={32}
                height={32}
                className="rounded-full mr-2"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center">
                <i className="fas fa-user text-gray-400 text-xs"></i>
              </div>
            )}
            <span className="text-sm text-text-light">{author.name}</span>
          </div>
          <span className="text-xs text-text-light">{date}</span>
        </div>
      </div>
    </div>
  );
} 