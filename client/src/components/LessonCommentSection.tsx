import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { MentionTextarea } from "@/components/MentionTextarea";
import { formatRelativeTime } from "@/lib/formatTime";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2, MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Comment = {
  id: number;
  lessonSlug: string;
  userId: number;
  parentCommentId: number | null;
  content: string;
  createdAt: Date | string;
  authorName: string;
  authorUsername: string | null;
  authorProfileImageUrl: string | null;
};

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

function CommentItem({
  comment,
  replies,
  lessonSlug,
  onReplySuccess,
}: {
  comment: Comment;
  replies: Comment[];
  lessonSlug: string;
  onReplySuccess: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const addReply = trpc.learning.comment.useMutation({
    onSuccess: () => {
      setReplyText("");
      setReplying(false);
      onReplySuccess();
      toast.success("Resposta publicada!");
    },
    onError: err => toast.error(err.message),
  });

  return (
    <div className="space-y-2">
      <div className="flex gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
        <UserAvatar
          src={comment.authorProfileImageUrl}
          name={comment.authorName}
          size={32}
          username={comment.authorUsername}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            {comment.authorUsername ? (
              <Link
                href={`/profile/${comment.authorUsername}`}
                className="font-medium hover:underline truncate"
              >
                {comment.authorName}
              </Link>
            ) : (
              <span className="font-medium truncate">{comment.authorName}</span>
            )}
            <span className="text-xs text-muted-foreground shrink-0">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="leading-relaxed">{renderContent(comment.content)}</p>
          <button
            type="button"
            className="mt-1.5 text-xs text-muted-foreground hover:text-accent flex items-center gap-1"
            onClick={() => setReplying(v => !v)}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Responder
          </button>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="ml-8 space-y-2 border-l-2 border-border/60 pl-3">
          {replies.map(reply => (
            <div key={reply.id} className="flex gap-2 rounded-lg bg-muted/25 px-3 py-2 text-sm">
              <UserAvatar
                src={reply.authorProfileImageUrl}
                name={reply.authorName}
                size={28}
                username={reply.authorUsername}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  {reply.authorUsername ? (
                    <Link
                      href={`/profile/${reply.authorUsername}`}
                      className="font-medium hover:underline truncate text-sm"
                    >
                      {reply.authorName}
                    </Link>
                  ) : (
                    <span className="font-medium truncate text-sm">{reply.authorName}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatRelativeTime(reply.createdAt)}
                  </span>
                </div>
                <p className="leading-relaxed text-sm">{renderContent(reply.content)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {replying && (
        <div className="ml-8 space-y-2">
          <MentionTextarea
            value={replyText}
            onChange={setReplyText}
            placeholder={`Responder ${comment.authorName}…`}
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="btn-primary"
              disabled={!replyText.trim() || addReply.isPending}
              onClick={() =>
                addReply.mutate({
                  lessonSlug,
                  content: replyText.trim(),
                  parentCommentId: comment.id,
                })
              }
            >
              {addReply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Responder"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function LessonCommentSection({ lessonSlug }: { lessonSlug: string }) {
  const [text, setText] = useState("");
  const utils = trpc.useUtils();
  const {
    data: comments,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.learning.comments.useQuery({ lessonSlug }, { retry: 1 });

  const addComment = trpc.learning.comment.useMutation({
    onSuccess: () => {
      setText("");
      utils.learning.comments.invalidate({ lessonSlug });
      utils.learning.engagement.invalidate({ lessonSlug });
      toast.success("Comentário publicado!");
    },
    onError: err => toast.error(err.message),
  });

  const { topLevel, repliesByParent } = useMemo(() => {
    const list = comments ?? [];
    const idSet = new Set(list.map(c => c.id));
    const top = list.filter(c => !c.parentCommentId || !idSet.has(c.parentCommentId));
    const byParent = new Map<number, Comment[]>();
    for (const c of list) {
      if (!c.parentCommentId || !idSet.has(c.parentCommentId)) continue;
      const arr = byParent.get(c.parentCommentId) ?? [];
      arr.push(c);
      byParent.set(c.parentCommentId, arr);
    }
    return { topLevel: top, repliesByParent: byParent };
  }, [comments]);

  function onReplySuccess() {
    utils.learning.comments.invalidate({ lessonSlug });
    utils.learning.engagement.invalidate({ lessonSlug });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Comentários</h3>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-center space-y-2">
          <p className="text-destructive">Não foi possível carregar os comentários.</p>
          {error?.message && <p className="text-xs text-muted-foreground">{error.message}</p>}
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {topLevel.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">Seja o primeiro a comentar</p>
          ) : (
            topLevel.map(c => (
              <CommentItem
                key={c.id}
                comment={c}
                replies={repliesByParent.get(c.id) ?? []}
                lessonSlug={lessonSlug}
                onReplySuccess={onReplySuccess}
              />
            ))
          )}
        </div>
      )}

      <div className="pt-2 border-t border-border/50 space-y-3">
        <MentionTextarea
          value={text}
          onChange={setText}
          placeholder="Escreva um comentário sobre esta aula…"
          rows={3}
        />
        <Button
          size="sm"
          className="btn-primary"
          disabled={!text.trim() || addComment.isPending}
          onClick={() => addComment.mutate({ lessonSlug, content: text.trim() })}
        >
          {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comentar"}
        </Button>
      </div>
    </div>
  );
}
