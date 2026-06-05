import { CommentSection } from "@/components/CommentSection";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import type { GroupMessage } from "@/data/mockGroupChat";
import { formatMessageTime } from "@/data/mockGroupChat";
import { cn } from "@/lib/utils";
import { Heart, MessageCircle } from "lucide-react";
import { Link } from "wouter";
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

type GroupMessageItemProps = {
  message: GroupMessage;
  onLike?: (id: number) => void;
};

export function GroupMessageItem({ message, onLike }: GroupMessageItemProps) {
  const [showThread, setShowThread] = useState(false);
  const [hover, setHover] = useState(false);

  return (
    <div
      className={cn(
        "group relative px-4 py-3 transition-colors",
        hover && "bg-muted/40",
        showThread && "bg-muted/30"
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex gap-3">
        <UserAvatar
          src={message.authorProfileImageUrl}
          name={message.authorName}
          size={40}
          username={message.authorUsername}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
            {message.authorUsername ? (
              <Link href={`/profile/${message.authorUsername}`} className="font-semibold text-sm hover:underline">
                {message.authorName}
              </Link>
            ) : (
              <span className="font-semibold text-sm">{message.authorName}</span>
            )}
            {message.authorRole === "admin" && (
              <Badge className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-0">ADMIN</Badge>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatMessageTime(message.createdAt)}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
            {renderContent(message.content)}
          </p>

          {message.imageUrl && (
            <img
              src={message.imageUrl}
              alt=""
              className="mt-2 max-w-full sm:max-w-md rounded-lg border border-border"
            />
          )}

          {(message.likes > 0 || message.commentCount > 0) && !showThread && (
            <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
              {message.likes > 0 && <span>{message.likes} curtida{message.likes !== 1 ? "s" : ""}</span>}
              {message.commentCount > 0 && (
                <button type="button" className="hover:text-accent" onClick={() => setShowThread(true)}>
                  {message.commentCount} resposta{message.commentCount !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {(hover || showThread) && (
        <div className="absolute right-4 top-2 flex items-center gap-0.5 rounded-lg border border-border bg-card shadow-sm p-0.5">
          <button
            type="button"
            onClick={() => !message.isMock && onLike?.(message.id)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-accent transition-colors"
            title="Curtir"
          >
            <Heart className={cn("h-4 w-4", message.liked && "fill-rose-500 text-rose-500")} />
          </button>
          <button
            type="button"
            onClick={() => setShowThread(v => !v)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-accent transition-colors"
            title="Responder"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {showThread && !message.isMock && message.id > 0 && (
        <div className="ml-[52px] mt-3 pl-3 border-l-2 border-border/60">
          <CommentSection postId={message.id} />
        </div>
      )}
    </div>
  );
}
