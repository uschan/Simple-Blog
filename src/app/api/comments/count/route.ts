export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Comment from "@/models/comment";
import Article from "@/models/article";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json({ error: "文章ID不能为空" }, { status: 400 });
    }

    await connectDB();

    let query: any = {};
    
    // 检查articleId是否是有效的ObjectId
    if (mongoose.Types.ObjectId.isValid(articleId)) {
      query.articleId = new mongoose.Types.ObjectId(articleId);
    } else {
      // 如果不是ObjectId，可能是文章slug，需要先查询文章
      const article = await Article.findOne({ slug: articleId });
      if (!article) {
        return NextResponse.json({ error: "未找到对应的文章" }, { status: 404 });
      }
      query.articleId = article._id;
    }

    // 只计算已审核的评论数量
    query.status = "approved";
    
    // 获取评论数量
    const count = await Comment.countDocuments(query);

    return NextResponse.json({
      success: true,
      count
    });
  } catch (error) {
    console.error("获取评论数量失败:", error);
    return NextResponse.json({ error: "获取评论数量失败" }, { status: 500 });
  }
} 