import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { CreatorCardData } from "@/components/CreatorCard";

export function CreatorStoryBubble({ creator }: { creator: CreatorCardData }) {
  const utils = trpc.useUtils();
  const toggle = trpc.follows.toggle.useMutation({
    onSuccess: () => {
      utils.follows.discover.invalidate();
      utils.follows.following.invalidate();
      utils.follows.followers.invalidate();
      utils.follows.stats.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const displayName = creator.name || creator.username || "Creator";
  const isFollowing = creator.followStatus === "following" || creator.followStatus === "mutual";
  const profileHref = creator.username ? `/profile/${creator.username}` : null;
  const label = creator.username ? `@${creator.username}` : displayName;

  const avatar = (
    <div
      className={cn(
        "rounded-full p-[2px]",
        creator.isOnline
          ? "bg-gradient-to-tr from-emerald-400 via-green-500 to-teal-400"
          : "bg-muted-foreground/35"
      )}
    >
      <div className="rounded-full bg-background p-[2px]">
        <UserAvatar
          src={creator.profileImageUrl}
          name={displayName}
          size={56}
          className="ring-0"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-[68px] shrink-0">
      <div className="relative">
        {profileHref ? (
          <Link href={profileHref} className="block rounded-full" aria-label={`Ver perfil de ${label}`}>
            {avatar}
          </Link>
        ) : (
          avatar
        )}

        {!isFollowing && (
          <button
            type="button"
            aria-label={`Seguir ${displayName}`}
            disabled={toggle.isPending}
            className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-accent text-accent-foreground shadow-sm disabled:opacity-60"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              toggle.mutate({ userId: creator.id });
            }}
          >
            {toggle.isPending ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <Plus className="h-3 w-3 stroke-[3]" />
            )}
          </button>
        )}

        {isFollowing && (
          <span
            className={cn(
              "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
              creator.isOnline ? "bg-emerald-500" : "bg-muted-foreground/45"
            )}
            aria-label={creator.isOnline ? "Online" : "Offline"}
          />
        )}
      </div>

      {profileHref ? (
        <Link
          href={profileHref}
          className="mt-1.5 max-w-[64px] truncate text-[10px] text-muted-foreground hover:text-foreground hover:underline"
        >
          {label}
        </Link>
      ) : (
        <span className="mt-1.5 max-w-[64px] truncate text-[10px] text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
