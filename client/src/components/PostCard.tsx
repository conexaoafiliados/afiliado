import { CommentSection } from "@/components/CommentSection";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";

function renderContent(content: string) {
  const parts = content.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="text-accent font-medium">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

interface PostCardProps {
  id: number;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked?: boolean;
  onLike?: (id: number) => void;
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
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);

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

      <p className="text-foreground mb-4 leading-relaxed">{renderContent(content)}</p>

      <div className="flex items-center gap-6 pt-4 border-t border-border text-muted-foreground">
        <button
          onClick={() => onLike?.(id)}
          className="flex items-center gap-2 hover:text-accent transition-colors"
        >
          <Heart className={`w-5 h-5 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
          <span className="text-sm">{likes}</span>
        </button>

        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-2 hover:text-accent transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{comments}</span>
        </button>
      </div>

      {showComments && <CommentSection postId={id} />}
    </Card>
  );
}
