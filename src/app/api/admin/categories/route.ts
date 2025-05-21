export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Category, Article } from '@/models';

// 获取所有分类
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 获取所有分类
    const categories = await Category.find()
      .sort({ order: 1, name: 1 })
      .lean();
      
    // 获取每个分类的文章数量
    for (const category of categories) {
      // 根据分类ID查询文章数量
      const count = await Article.countDocuments({ categories: category._id });
      // 更新category对象的count字段
      category.count = count;
    }
    
    return NextResponse.json({ 
      message: 'Success',
      data: categories
    });
  } catch (error: any) {
    console.error('获取分类失败:', error);
    return NextResponse.json(
      { message: '获取分类列表失败', error: error.message },
      { status: 500 }
    );
  }
}

// 创建新分类
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();
    
    // 生成唯一的slug
    if (!data.slug) {
      data.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    // 创建新分类
    const newCategory = new Category(data);
    await newCategory.save();
    
    return NextResponse.json({ 
      message: '分类创建成功',
      data: newCategory
    }, { status: 201 });
  } catch (error: any) {
    console.error('创建分类失败:', error);
    return NextResponse.json(
      { message: '创建分类失败', error: error.message },
      { status: 500 }
    );
  }
}

// 更新分类API
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();
    const { id, ...updateData } = data;
    
    if (!id) {
      return NextResponse.json(
        { message: '缺少分类ID' },
        { status: 400 }
      );
    }
    
    // 更新分类
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedCategory) {
      return NextResponse.json(
        { message: '分类不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: '分类更新成功',
      data: updatedCategory
    });
  } catch (error: any) {
    console.error('更新分类失败:', error);
    return NextResponse.json(
      { message: '更新分类失败', error: error.message },
      { status: 500 }
    );
  }
}

// 删除分类API
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { message: '缺少分类ID' },
        { status: 400 }
      );
    }
    
    // 检查分类是否有子分类
    const hasChildren = await Category.exists({ parentId: id });
    if (hasChildren) {
      return NextResponse.json(
        { message: '请先删除该分类下的子分类' },
        { status: 400 }
      );
    }
    
    // 删除分类
    const deletedCategory = await Category.findByIdAndDelete(id);
    
    if (!deletedCategory) {
      return NextResponse.json(
        { message: '分类不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: '分类删除成功'
    });
  } catch (error: any) {
    console.error('删除分类失败:', error);
    return NextResponse.json(
      { message: '删除分类失败', error: error.message },
      { status: 500 }
    );
  }
} 