import { CommentSection } from "@/components/CommentSection";
import { UserAvatar } from "@/components/UserAvatar";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";

function renderContent(content: string) {
  const parts = content.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <Link key={i} href={`/profile/${part.slice(1)}`} className="text-accent font-medium hover:underline">
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

interface PostCardProps {
  id: number;
  author: string;
  authorUsername?: string | null;
  authorProfileImageUrl?: string | null;
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
  authorUsername,
  authorProfileImageUrl,
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
      <div className="flex items-start gap-3 mb-4">
        <UserAvatar
          src={authorProfileImageUrl}
          name={author}
          size={44}
          username={authorUsername}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {authorUsername ? (
              <Link href={`/profile/${authorUsername}`} className="font-semibold hover:underline truncate">
                {author}
              </Link>
            ) : (
              <h4 className="font-semibold truncate">{author}</h4>
            )}
            <span className="text-xs text-muted-foreground shrink-0">{timestamp}</span>
          </div>
          {authorUsername && (
            <p className="text-xs text-muted-foreground">@{authorUsername}</p>
          )}
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
