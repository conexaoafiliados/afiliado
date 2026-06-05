import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/formatTime";
import { trpc } from "@/lib/trpc";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const typeLabels: Record<string, string> = {
  post_like: "❤️",
  post_comment: "💬",
  mention: "@",
  goal_unlock: "🎯",
  user_follow: "👤",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: count = 0 } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: items = [] } = trpc.notifications.list.useQuery({ limit: 15 }, { enabled: open });

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });
  const markAll = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  function handleClick(id: number, link: string | null) {
    markRead.mutate({ id });
    setOpen(false);
    if (link) setLocation(link);
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(v => !v)}>
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-accent text-[10px] text-white flex items-center justify-center font-bold">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 md:bg-transparent" onClick={() => setOpen(false)} />
          <div
            className="
              fixed z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl
              left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-[calc(100vw-2rem)] max-w-sm max-h-[min(70vh,24rem)]
              md:absolute md:left-auto md:right-0 md:top-full md:translate-x-0 md:translate-y-0 md:mt-2
              md:w-80 md:max-h-96
            "
          >
            <div className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm">Notificações</span>
              {count > 0 && (
                <button
                  type="button"
                  className="text-xs text-accent hover:underline"
                  onClick={() => markAll.mutate()}
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1 min-h-0">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma notificação</p>
            ) : (
              <ul>
                {items.map(n => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={`w-full text-left px-4 py-3 hover:bg-muted/60 border-b border-border/50 ${
                        !n.read ? "bg-accent/5" : ""
                      }`}
                      onClick={() => handleClick(n.id, n.link)}
                    >
                      <div className="flex gap-2">
                        <span className="text-lg shrink-0">{typeLabels[n.type] ?? "•"}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatRelativeTime(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
