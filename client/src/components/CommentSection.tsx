import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { MentionTextarea } from "@/components/MentionTextarea";
import { formatRelativeTime } from "@/lib/formatTime";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function renderContent(content: string) {
  const parts = content.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <Link key={i} href={`/profile/${part.slice(1)}`}>
        <a className="text-accent font-medium hover:underline">{part}</a>
      </Link>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function CommentSection({ postId }: { postId: number }) {
  const [text, setText] = useState("");
  const utils = trpc.useUtils();
  const { data: comments, isLoading } = trpc.community.comments.useQuery({ postId });

  const addComment = trpc.community.comment.useMutation({
    onSuccess: () => {
      setText("");
      utils.community.comments.invalidate({ postId });
      utils.community.feed.invalidate();
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
      toast.success("Comentário publicado!");
    },
    onError: err => toast.error(err.message),
  });

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-4">
      <MentionTextarea
        value={text}
        onChange={setText}
        placeholder="Escreva um comentário…"
        rows={2}
      />
      <Button
        size="sm"
        className="btn-primary"
        disabled={!text.trim() || addComment.isPending}
        onClick={() => addComment.mutate({ postId, content: text.trim() })}
      >
        {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comentar"}
      </Button>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {(comments ?? []).map(c => (
            <div key={c.id} className="flex gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <UserAvatar
                src={c.authorProfileImageUrl}
                name={c.authorName}
                size={32}
                username={c.authorUsername}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  {c.authorUsername ? (
                    <Link href={`/profile/${c.authorUsername}`}>
                      <a className="font-medium hover:underline truncate">{c.authorName}</a>
                    </Link>
                  ) : (
                    <span className="font-medium truncate">{c.authorName}</span>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatRelativeTime(c.createdAt)}
                  </span>
                </div>
                <p className="leading-relaxed">{renderContent(c.content)}</p>
              </div>
            </div>
          ))}
          {comments?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">Seja o primeiro a comentar</p>
          )}
        </div>
      )}
    </div>
  );
}
