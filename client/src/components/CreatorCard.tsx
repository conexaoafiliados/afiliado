import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, UserCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

export type CreatorFollowStatus = "none" | "following" | "follower" | "mutual";

export interface CreatorCardData {
  id: number;
  name: string | null;
  username: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  tiktokFollowers: number;
  platformFollowers: number;
  followStatus: CreatorFollowStatus;
}

function followButtonLabel(status: CreatorFollowStatus, pending: boolean): string {
  if (pending) return "...";
  switch (status) {
    case "following":
      return "Seguindo";
    case "mutual":
      return "Amigos";
    case "follower":
      return "Seguir de volta";
    default:
      return "Seguir";
  }
}

export function CreatorCard({ creator }: { creator: CreatorCardData }) {
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

  return (
    <Card className="card-elegant p-4 flex flex-col gap-3 min-w-[220px] max-w-full">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-accent to-secondary flex items-center justify-center shrink-0">
          {creator.profileImageUrl ? (
            <img src={creator.profileImageUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-white font-bold text-lg">{displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{displayName}</p>
          {creator.username && (
            <p className="text-xs text-muted-foreground truncate">@{creator.username}</p>
          )}
        </div>
      </div>

      {creator.bio && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{creator.bio}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {creator.platformFollowers} {creator.platformFollowers === 1 ? "seguidor" : "seguidores"}
        </span>
        {creator.tiktokFollowers > 0 && (
          <span>{creator.tiktokFollowers.toLocaleString("pt-BR")} no TikTok</span>
        )}
      </div>

      <Button
        size="sm"
        variant={isFollowing || creator.followStatus === "mutual" ? "outline" : "default"}
        className={!isFollowing && creator.followStatus !== "mutual" ? "btn-primary" : ""}
        disabled={toggle.isPending}
        onClick={() => toggle.mutate({ userId: creator.id })}
      >
        {toggle.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : creator.followStatus === "mutual" ? (
          <UserCheck className="h-4 w-4 mr-1.5" />
        ) : (
          <UserPlus className="h-4 w-4 mr-1.5" />
        )}
        {followButtonLabel(creator.followStatus, toggle.isPending)}
      </Button>
    </Card>
  );
}
