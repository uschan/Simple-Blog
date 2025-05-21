"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

interface CommentFormProps {
  articleId: string;
  onCommentAdded: () => void;
}

export default function CommentForm({ articleId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 生成随机的wildsalt游客ID
  const generateRandomName = () => {
    const random = Math.floor(100000 + Math.random() * 900000); // 6位随机数
    return `# wildsalt游客${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error("评论内容不能为空");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
          author: {
            name: generateRandomName(),
            email: "guest@wildsalt.me" // 默认访客邮箱
          },
          content: content.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "提交评论失败");
      }
      
      // 清空表单
      setContent("");
      
      // 通知父组件评论已添加
      onCommentAdded();
      
      toast.success("评论提交成功");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "提交评论失败");
      console.error("提交评论失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-4 border border-gray-200 dark:bg-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          rows={3}
          placeholder="写下你的评论..."
          required
        />
      </div>
      <div className="flex justify-between items-center">
        <div className="text-xs italic text-gray-500">
          评论将以随机ID显示
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`bg-primary text-sm text-white px-4 py-2 rounded-lg transition-colors ${
            isSubmitting
              ? "opacity-70 cursor-not-allowed"
              : "hover:bg-primary-dark"
          }`}
        >
          {isSubmitting ? "提交中..." : "发表评论"}
        </button>
      </div>
    </form>
  );
} 