export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Article, IArticle } from '@/models';
import mongoose from 'mongoose';

// 获取文章列表或单个文章
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    // 如果提供了ID，获取单个文章
    if (id) {
      // 验证ObjectId格式有效
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return NextResponse.json(
          { message: '无效的文章ID格式' },
          { status: 400 }
        );
      }
      
      const dbArticle = await Article.findById(id)
        .populate('categories', 'name')
        .lean();
      
      if (!dbArticle) {
        return NextResponse.json(
          { message: '文章不存在' },
          { status: 404 }
        );
      }
      
      // 映射数据库字段到前端字段
      const article = {
        ...dbArticle,
        excerpt: (dbArticle as any).summary || '',
        featuredImage: (dbArticle as any).coverImage || '',
      };
      
      return NextResponse.json({ 
        message: 'Success',
        data: article
      });
    }
    
    // 否则获取文章列表
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    
    // 构建查询条件
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.categories = new mongoose.Types.ObjectId(category);
    }
    
    if (search) {
      // 1. 使用文本索引搜索 - 适用于全词匹配
      // query.$text = { $search: search };
      
      // 2. 使用正则表达式搜索 - 更适合中文和部分匹配
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },       // 标题匹配
        { content: searchRegex },     // 内容匹配
        { summary: searchRegex },     // 摘要匹配
        { tags: searchRegex }         // 标签匹配
      ];
      
      console.log('搜索条件:', {
        searchTerm: search,
        regex: searchRegex.toString(),
        query: JSON.stringify(query)
      });
    }
    
    const skip = (page - 1) * limit;
    
    // 查询文章总数
    const total = await Article.countDocuments(query);
    
    // 查询文章列表
    const dbArticles = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('categories', 'name')
      .populate('author', 'username')
      .lean();
    
    // 映射数据库字段到前端字段 - 使用类型断言避免TypeScript错误
    const articles = dbArticles.map(dbArticle => ({
      ...dbArticle,
      excerpt: (dbArticle as any).summary || '',
      featuredImage: (dbArticle as any).coverImage || '',
      // 增加新字段映射
      coverType: (dbArticle as any).coverType || 'image',
      galleryImages: (dbArticle as any).coverGallery || [],
      videoUrl: (dbArticle as any).coverVideo || '',
      isFeatured: (dbArticle as any).isFeatured || false,
      isSlider: (dbArticle as any).isSlider || false,
    }));
    
    return NextResponse.json({ 
      message: 'Success',
      data: {
        articles,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('获取文章失败:', error);
    return NextResponse.json(
      { message: '获取文章列表失败', error: error.message },
      { status: 500 }
    );
  }
}

// 创建新文章
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const formData = await request.json();
    
    console.log('接收到文章数据:', formData);
    
    // 创建一个默认的ObjectId用于author字段
    const defaultAuthorId = new mongoose.Types.ObjectId();
    
    // 映射前端字段到数据库字段
    const data: any = {
      title: formData.title,
      content: formData.content || '',
      status: formData.status || 'draft',
      summary: formData.summary || formData.excerpt || formData.title || '',
      tags: formData.tags || [],
      // 设置默认author
      author: defaultAuthorId
    };
    
    // 处理分类 - 确保有效
    if (formData.categories && Array.isArray(formData.categories) && formData.categories.length > 0) {
      data.categories = formData.categories.filter((id: string) => 
        // 确保是有效的ObjectId格式
        /^[0-9a-fA-F]{24}$/.test(id)
      );
    } else {
      data.categories = [];
    }
    
    // 处理作者 - 使用authorName保存作者信息
    data.authorName = formData.authorName || formData.author || '未知作者';
    
    // 处理媒体字段 - 根据coverType确定使用哪个媒体字段
    if (formData.coverType) {
      data.coverType = formData.coverType; // 保存封面类型
      
      if (formData.coverType === 'image' && formData.coverImage) {
        data.coverImage = formData.coverImage || '';
      } else if (formData.coverType === 'gallery' && formData.coverGallery) {
        data.coverImage = Array.isArray(formData.coverGallery) && formData.coverGallery.length > 0 
          ? formData.coverGallery[0] 
          : ''; // 主图片使用第一张图
        data.coverGallery = Array.isArray(formData.coverGallery) ? formData.coverGallery : []; // 保存整个画廊
      } else if (formData.coverType === 'video' && formData.coverVideo) {
        data.coverImage = formData.coverVideo || ''; // 视频链接作为封面
        data.coverVideo = formData.coverVideo || ''; // 保存视频链接
      }
    }
    
    // 确保至少有一个空字符串作为coverImage
    data.coverImage = data.coverImage || '';
    
    // 处理推荐设置
    data.isFeatured = !!formData.isFeatured;
    data.isSlider = !!formData.isSlider;
    
    // 处理显示选项
    if (formData.displayOption) {
      data.displayOption = formData.displayOption;
    }
    
    // 生成唯一的slug
    data.slug = formData.slug || formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    
    // 确保slug唯一
    let slugExists = await Article.exists({ slug: data.slug });
    let counter = 1;
    const originalSlug = data.slug;
    while (slugExists) {
      data.slug = `${originalSlug}-${counter}`;
      slugExists = await Article.exists({ slug: data.slug });
      counter++;
    }
    
    // 如果状态是已发布，设置发布时间
    if (data.status === 'published') {
      data.publishedAt = formData.publishedAt || new Date();
    }
    
    console.log('处理后的文章数据:', data);
    
    // 创建新文章
    const newArticle = new Article(data);
    await newArticle.save();
    
    return NextResponse.json({ 
      message: '文章创建成功',
      data: newArticle
    }, { status: 201 });
  } catch (error: any) {
    console.error('创建文章失败:', error);
    // 返回更详细的错误信息
    return NextResponse.json(
      { message: `创建文章失败: ${error.message}`, error: error.stack },
      { status: 500 }
    );
  }
}

// 更新文章API
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const formData = await request.json();
    const { id, ...formUpdateData } = formData;
    
    // 映射前端字段到数据库字段
    const updateData = {
      ...formUpdateData,
      summary: formUpdateData.excerpt || '',
      coverImage: formUpdateData.featuredImage || '',
    };
    
    if (!id) {
      return NextResponse.json(
        { message: '缺少文章ID' },
        { status: 400 }
      );
    }
    
    // 如果状态从草稿改为已发布，设置发布时间
    if (updateData.status === 'published') {
      // 使用findById而不是lean()以确保正确获取文档类型
      const article = await Article.findById(id);
      
      if (article && article.status !== 'published') {
        updateData.publishedAt = new Date();
      }
    }
    
    // 更新文章
    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categories', 'name');
    
    if (!updatedArticle) {
      return NextResponse.json(
        { message: '文章不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: '文章更新成功',
      data: updatedArticle
    });
  } catch (error: any) {
    console.error('更新文章失败:', error);
    return NextResponse.json(
      { message: '更新文章失败', error: error.message },
      { status: 500 }
    );
  }
}

// 删除文章API
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { message: '缺少文章ID' },
        { status: 400 }
      );
    }
    
    // 删除文章
    const deletedArticle = await Article.findByIdAndDelete(id);
    
    if (!deletedArticle) {
      return NextResponse.json(
        { message: '文章不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: '文章删除成功'
    });
  } catch (error: any) {
    console.error('删除文章失败:', error);
    return NextResponse.json(
      { message: '删除文章失败', error: error.message },
      { status: 500 }
    );
  }
} 