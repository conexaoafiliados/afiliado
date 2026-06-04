import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

interface PostCardProps {
  id: number;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked?: boolean;
  onLike?: (id: number) => void;
  onComment?: (id: number) => void;
  onShare?: (id: number) => void;
}

export function PostCard({
  id,
  author,
  content,
  timestamp,
  likes,
  comments,
  liked = false,
  onLike,
  onComment,
  onShare,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(liked);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    onLike && onLike(id);
  };

  return (
    <Card className="card-elegant">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-white font-bold text-sm">
          {author.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{author}</h4>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>
        </div>
      </div>

      <p className="text-foreground mb-4 leading-relaxed">{content}</p>

      <div className="flex items-center justify-between pt-4 border-t border-border text-muted-foreground">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 hover:text-accent transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${
              isLiked ? "fill-rose-500 text-rose-500" : ""
            }`}
          />
          <span className="text-sm">{likeCount}</span>
        </button>

        <button
          onClick={() => onComment && onComment(id)}
          className="flex items-center gap-2 hover:text-accent transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{comments}</span>
        </button>

        <button
          onClick={() => onShare && onShare(id)}
          className="flex items-center gap-2 hover:text-accent transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </Card>
  );
}
