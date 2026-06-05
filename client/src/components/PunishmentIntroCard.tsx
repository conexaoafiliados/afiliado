import { AnnouncementCommentSection } from "@/components/AnnouncementCommentSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { MOCK_PUNISHMENT_COMMENTS, PUNISHMENT_INTRO } from "@shared/punishments/content";
import { formatRelativeTime } from "@/lib/formatTime";
import { trpc } from "@/lib/trpc";
import { Heart, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

type PunishmentIntroCardProps = {
  announcementId?: number;
  likes?: number;
  liked?: boolean;
  commentCount?: number;
  onLike?: () => void;
  liking?: boolean;
  useMock?: boolean;
};

export function PunishmentIntroCard({
  announcementId,
  likes = 54,
  liked = false,
  commentCount,
  onLike,
  liking,
  useMock,
}: PunishmentIntroCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const previewLimit = 220;
  const needsExpand = PUNISHMENT_INTRO.preview.length > previewLimit;
  const displayText =
    expanded || !needsExpand
      ? PUNISHMENT_INTRO.preview
      : `${PUNISHMENT_INTRO.preview.slice(0, previewLimit).trim()}…`;

  function handleLike() {
    if (useMock) {
      toast.message("Demonstração", { description: "Curtidas disponíveis após conectar o Supabase." });
      return;
    }
    onLike?.();
  }

  const totalComments = commentCount ?? (useMock ? MOCK_PUNISHMENT_COMMENTS.length : 0);

  return (
    <Card className="card-elegant space-y-4">
      <Link href="/acessos/punicoes/guia">
        <a className="block group">
          <h2 className="text-lg font-bold uppercase tracking-tight group-hover:text-accent transition-colors">
            {PUNISHMENT_INTRO.title}
          </a>
        </a>
      </Link>

      <div className="flex items-start gap-3">
        <UserAvatar name={PUNISHMENT_INTRO.authorName} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{PUNISHMENT_INTRO.authorName}</span>
            <Badge className="bg-primary/10 text-primary border-0">Equipe</Badge>
            <Badge className="bg-muted text-muted-foreground border-0">Administrador</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Membro desde 8 de janeiro de 2026</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{displayText}</p>

      {needsExpand && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-sm font-medium text-accent hover:underline"
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}

      <Link href="/acessos/punicoes/guia">
        <a>
          <Button className="btn-primary w-full sm:w-auto">Ver guia completo de defesas</Button>
        </a>
      </Link>

      <div className="flex items-center gap-6 pt-2 border-t border-border text-muted-foreground">
        <button
          type="button"
          onClick={handleLike}
          disabled={liking}
          className="flex items-center gap-2 hover:text-accent transition-colors disabled:opacity-60"
        >
          {liking ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Heart className={`h-5 w-5 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
          )}
          <span className="text-sm tabular-nums">{likes}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments(v => !v)}
          className="text-sm hover:text-accent transition-colors"
        >
          {totalComments} comentário{totalComments !== 1 ? "s" : ""}
        </button>
      </div>

      {showComments && (
        <div className="pt-2 border-t border-border">
          {useMock || !announcementId ? (
            <div className="space-y-3">
              {MOCK_PUNISHMENT_COMMENTS.map(c => (
                <div key={c.id} className="flex gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <UserAvatar name={c.authorName} size={32} />
                  <div>
                    <p className="font-medium text-sm">{c.authorName}</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatRelativeTime(new Date(Date.now() - c.hoursAgo * 3600000))}
                    </p>
                    <p className="leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-2">
                Comentar disponível após executar a migration de punições no Supabase.
              </p>
            </div>
          ) : (
            <AnnouncementCommentSection announcementId={announcementId} />
          )}
        </div>
      )}
    </Card>
  );
}
