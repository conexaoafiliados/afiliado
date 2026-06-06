import { AnnouncementCommentSection } from "@/components/AnnouncementCommentSection";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AnnouncementFeedItem } from "@/data/mockAnnouncements";
import { formatRelativeTime } from "@/lib/formatTime";
import { cn } from "@/lib/utils";
import { FileText, Heart, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { useMemo, useState } from "react";

const PREVIEW_LENGTH = 320;

function renderContent(content: string) {
  const parts = content.split(/(@[a-zA-Z0-9._]+)/g);
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

function formatMemberSince(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

function bannerGradient(title: string) {
  if (title.includes("GAMIFICAÇÃO") || title.includes("🔥")) {
    return "from-blue-600 via-blue-700 to-indigo-800";
  }
  if (title.includes("🏆")) {
    return "from-amber-500 via-orange-500 to-red-500";
  }
  if (title.includes("📅")) {
    return "from-violet-500 to-purple-700";
  }
  return "from-primary/90 to-accent";
}

type AnnouncementCardProps = AnnouncementFeedItem & {
  onLike?: (id: number) => void;
};

export function AnnouncementCard({
  id,
  title,
  content,
  imageUrl,
  attachmentUrl,
  attachmentName,
  likes,
  commentCount,
  liked,
  createdAt,
  authorName,
  authorUsername,
  authorProfileImageUrl,
  authorRole,
  authorMemberSince,
  isMock,
  onLike,
}: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const needsExpand = content.length > PREVIEW_LENGTH;
  const displayContent = useMemo(() => {
    if (expanded || !needsExpand) return content;
    return `${content.slice(0, PREVIEW_LENGTH).trim()}…`;
  }, [content, expanded, needsExpand]);

  return (
    <Card className="card-elegant overflow-hidden p-0">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full max-h-56 object-cover border-b border-border" />
      ) : (
        <div
          className={cn(
            "px-5 py-8 text-white bg-gradient-to-br border-b border-border",
            bannerGradient(title)
          )}
        >
          <p className="text-lg font-bold leading-snug drop-shadow-sm">{title}</p>
        </div>
      )}

      <div className="p-5 space-y-4">
        {imageUrl && <h2 className="text-lg font-bold leading-snug">{title}</h2>}

        <div className="flex items-start gap-3">
          <UserAvatar
            src={authorProfileImageUrl}
            name={authorName}
            size={44}
            username={authorUsername}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {authorUsername ? (
                <Link href={`/profile/${authorUsername}`} className="font-semibold hover:underline">
                  {authorName}
                </Link>
              ) : (
                <span className="font-semibold">{authorName}</span>
              )}
              {authorRole === "admin" && (
                <Badge className="bg-primary/10 text-primary border-0">Equipe</Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                {formatRelativeTime(createdAt)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Membro desde {formatMemberSince(authorMemberSince)}
            </p>
          </div>
        </div>

        <div className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">
          {renderContent(displayContent)}
        </div>

        {needsExpand && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="text-sm font-medium text-accent hover:underline"
          >
            {expanded ? "Ver menos" : "Ver mais"}
          </button>
        )}

        {attachmentName && (
          <a
            href={attachmentUrl ?? "#"}
            target={attachmentUrl ? "_blank" : undefined}
            rel="noopener noreferrer"
            onClick={e => !attachmentUrl && e.preventDefault()}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors",
              attachmentUrl && "hover:bg-muted/50"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{attachmentName}</p>
              <p className="text-xs text-muted-foreground">
                {attachmentUrl ? "Clique para abrir" : "Anexo em breve"}
              </p>
            </div>
          </a>
        )}

        <div className="flex items-center gap-6 pt-2 border-t border-border text-muted-foreground">
          <button
            type="button"
            onClick={() => !isMock && onLike?.(id)}
            disabled={isMock}
            className={cn(
              "flex items-center gap-2 transition-colors",
              isMock ? "opacity-60 cursor-default" : "hover:text-accent"
            )}
          >
            <Heart className={cn("w-5 h-5", liked && "fill-rose-500 text-rose-500")} />
            <span className="text-sm tabular-nums">{likes}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowComments(v => !v)}
            className="flex items-center gap-2 hover:text-accent transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm tabular-nums">{commentCount}</span>
          </button>

          {(likes > 0 || commentCount > 0) && (
            <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
              {likes} curtida{likes !== 1 ? "s" : ""} • {commentCount} comentário
              {commentCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {showComments && (
          <AnnouncementCommentSection announcementId={id} disabled={isMock} />
        )}
      </div>
    </Card>
  );
}
