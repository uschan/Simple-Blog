export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Comment from "@/models/comment";
import Article from "@/models/article";
import mongoose from "mongoose";

// IP地址对应的上次评论时间
const commentRateLimit = new Map<string, number>();
// 评论间隔时间（毫秒）
const COMMENT_INTERVAL = 60 * 1000; // 1分钟

// 内容过滤（简单实现，正式环境应使用更复杂的内容审核系统）
function containsSensitiveContent(content: string): boolean {
  const sensitiveWords = [
    "广告", "优惠", "促销", "打折", "代购", "私聊",
    "微信", "电报", "QQ", "加我", "联系我", "免费",
    // 添加更多敏感词汇...
  ];
  
  const lowerContent = content.toLowerCase();
  return sensitiveWords.some(word => lowerContent.includes(word));
}

// 获取评论列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json(
        { error: "文章ID不能为空" },
        { status: 400 }
      );
    }

    await connectDB();

    // 检查articleId是否是有效的ObjectId
    let filter: any = {};
    if (mongoose.Types.ObjectId.isValid(articleId)) {
      filter.articleId = new mongoose.Types.ObjectId(articleId);
    } else {
      // 如果不是ObjectId，可能是文章slug，需要先查询文章
      const article = await Article.findOne({ slug: articleId });
      if (!article) {
        return NextResponse.json(
          { error: "未找到对应的文章" },
          { status: 404 }
        );
      }
      filter.articleId = article._id;
    }

    // 只获取已审核的评论
    filter.status = "approved";

    const comments = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("获取评论失败:", error);
    return NextResponse.json(
      { error: "获取评论失败" },
      { status: 500 }
    );
  }
}

// 创建评论
export async function POST(request: NextRequest) {
  try {
    // 获取客户端IP和用户代理
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               request.ip || 
               "unknown";
    
    // 高频评论限制检查
    const lastCommentTime = commentRateLimit.get(ip);
    const now = Date.now();
    
    if (lastCommentTime && now - lastCommentTime < COMMENT_INTERVAL) {
      const waitTime = Math.ceil((COMMENT_INTERVAL - (now - lastCommentTime)) / 1000);
      return NextResponse.json(
        { error: `评论太频繁，请等待${waitTime}秒后再试` },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const { articleId, content, author } = body;

    if (!articleId || !content) {
      return NextResponse.json(
        { error: "文章ID和评论内容不能为空" },
        { status: 400 }
      );
    }
    
    // 内容长度限制
    if (content.length > 500) {
      return NextResponse.json(
        { error: "评论内容不能超过500字" },
        { status: 400 }
      );
    }
    
    // 敏感内容检查
    if (containsSensitiveContent(content)) {
      return NextResponse.json(
        { error: "评论内容包含敏感词汇" },
        { status: 400 }
      );
    }

    await connectDB();

    // 确保文章存在
    let article;
    if (mongoose.Types.ObjectId.isValid(articleId)) {
      article = await Article.findById(articleId);
    } else {
      article = await Article.findOne({ slug: articleId });
    }

    if (!article) {
      return NextResponse.json(
        { error: "未找到对应的文章" },
        { status: 404 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "unknown";

    // 创建评论
    const comment = new Comment({
      content,
      articleId: article._id,
      author: {
        name: author.name || "匿名访客",
        email: author.email || "guest@wildsalt.me",
        website: author.website,
        avatar: author.avatar,
      },
      status: "approved", // 可以根据需要修改为审核状态
      ip,
      userAgent,
    });

    await comment.save();

    // 更新文章评论计数
    await Article.findByIdAndUpdate(article._id, {
      $inc: { comments: 1 },
    });
    
    // 更新评论频率限制
    commentRateLimit.set(ip, now);

    return NextResponse.json({
      success: true,
      message: "评论创建成功",
      data: comment,
    });
  } catch (error) {
    console.error("创建评论失败:", error);
    return NextResponse.json(
      { error: "创建评论失败" },
      { status: 500 }
    );
  }
} 