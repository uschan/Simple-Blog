export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Article, User } from '@/models';
import connectDB from '@/lib/db';
import mongoose, { Document } from 'mongoose';
import { IArticle } from '@/models/article';

// 定义相关文章的接口
interface RelatedArticle {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  coverImage?: string;
  coverType?: string;
}

// 定义文章分类接口
interface Category {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
}

// 定义作者接口
interface Author {
  _id?: mongoose.Types.ObjectId;
  name: string;
  image?: string;
  bio?: string;
}

// 定义转换后的文章接口
interface TransformedArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  date: string;
  category: string;
  categorySlug: string;
  views: number;
  coverImage: string;
  coverType: string;
  coverGallery: string[];
  coverVideo: string;
  author: Author;
  tags: string[];
  relatedArticles: {
    id: string;
    title: string;
    slug: string;
    coverImage: string;
  }[];
}

// 获取单篇文章详情
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { message: '文章slug不能为空' },
        { status: 400 }
      );
    }
    
    // 查找文章
    const article: any = await Article.findOne({ 
      slug: slug,
      status: 'published' 
    })
    .populate('categories', 'name slug')
    .populate('author', 'name image bio')
    .lean();
    
    if (!article) {
      return NextResponse.json(
        { message: '文章不存在' },
        { status: 404 }
      );
    }
    
    // 获取相关文章 - 从相同分类中选取3篇其他文章
    let relatedArticles: any[] = [];
    if (article.categories && article.categories.length > 0) {
      const categoryIds = article.categories.map((cat: any) => cat._id);
      relatedArticles = await Article.find({
        categories: { $in: categoryIds },
        _id: { $ne: article._id },
        status: 'published'
      })
      .select('title slug coverImage coverType _id')
      .limit(3)
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();
    }
    
    // 格式化作者信息 (如果没有作者信息，提供默认值)
    let author = {
      name: article.authorName || '匿名',
      image: '/images/avatar.png',
      bio: '暂无作者简介'
    };
    
    if (article.author) {
      author = {
        name: article.author.name || article.authorName || '匿名',
        image: article.author.image || '/images/avatar.png',
        bio: article.author.bio || '暂无作者简介'
      };
    }
    
    // 转换数据格式
    const transformedArticle = {
      id: article._id.toString(),
      title: article.title,
      slug: article.slug,
      content: article.content,
      date: article.publishedAt ? new Date(article.publishedAt).toISOString().split('T')[0] : 
            new Date(article.createdAt).toISOString().split('T')[0],
      category: article.categories && article.categories.length > 0 ? article.categories[0].name : '未分类',
      categorySlug: article.categories && article.categories.length > 0 ? article.categories[0].slug : 'uncategorized',
      views: article.views || 0,
      coverImage: article.coverImage || '/images/default.jpg',
      coverType: article.coverType || 'image',
      coverGallery: article.coverGallery || [],
      coverVideo: article.coverVideo || '',
      author,
      tags: article.tags || [],
      relatedArticles: relatedArticles.map((related: any) => ({
        id: related._id.toString(),
        title: related.title,
        slug: related.slug,
        coverImage: related.coverImage || '/images/avatar.png'
      }))
    };
    
    return NextResponse.json({
      message: 'Success',
      data: transformedArticle
    });
  } catch (error: any) {
    console.error('获取文章详情失败:', error);
    return NextResponse.json(
      { message: '获取文章详情失败', error: error.message },
      { status: 500 }
    );
  }
} 