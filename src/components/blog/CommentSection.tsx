"use client";

import { useState, useEffect } from "react";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

interface CommentSectionProps {
  articleId: string;
}

export default function CommentSection({ articleId }: CommentSectionProps) {
  const [commentCount, setCommentCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 获取评论数量
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const response = await fetch(`/api/comments/count?articleId=${articleId}`);
        if (response.ok) {
          const data = await response.json();
          setCommentCount(data.count || 0);
        }
      } catch (error) {
        console.error("获取评论数量失败:", error);
      }
    };

    fetchCommentCount();
  }, [articleId, refreshTrigger]);

  // 评论成功后刷新评论列表
  const handleCommentAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="bg-bg-card rounded-lg overflow-hidden shadow-sm mb-8 border border-gray-200 p-4">
      <h2 className="text-lg font-medium underline underline-offset-8 decoration-wavy mb-4 flex items-center">
        <i className="fa-solid fa-comment-dots text-2xl mr-3"></i>
        评论 ({commentCount})
      </h2>
      
      {/* 评论表单 */}
      <CommentForm articleId={articleId} onCommentAdded={handleCommentAdded} />
      
      {/* 评论列表 */}
      <CommentList articleId={articleId} refreshTrigger={refreshTrigger} />
    </div>
  );
} 