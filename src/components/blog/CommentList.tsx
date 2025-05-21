"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface CommentAuthor {
  name: string;
  email?: string;
  website?: string;
  avatar?: string;
}

interface Comment {
  _id: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  likes: number;
}

interface CommentListProps {
  articleId: string;
  refreshTrigger: number;
}

export default function CommentList({ articleId, refreshTrigger }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      setError("");
      
      try {
        const response = await fetch(`/api/comments?articleId=${articleId}`);
        
        if (!response.ok) {
          throw new Error("获取评论失败");
        }
        
        const data = await response.json();
        setComments(data.data || []);
      } catch (error) {
        console.error("获取评论失败:", error);
        setError("加载评论失败，请稍后再试");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchComments();
  }, [articleId, refreshTrigger]);

  // 格式化时间
  const formatCommentDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-6 text-red-500">{error}</div>;
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-6 text-text-light">
        暂无评论，成为第一个评论的人吧！
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment._id} className="border-b border-gray-100 pb-4 last:border-0">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-gray-500">
              <i className="fa-solid fa-person-drowning"></i>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium">
                  {comment.author.name}
                </div>
                <div className="text-xs text-text-light">
                  {formatCommentDate(comment.createdAt)}
                </div>
              </div>
              
              <div className="text-text-light mb-2 whitespace-pre-wrap break-words">
                {comment.content}
              </div>
              
                            {/* 移除点赞和回复按钮 */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 