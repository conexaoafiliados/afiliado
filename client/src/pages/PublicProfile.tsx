import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatGoalLabel } from "@/lib/goals";
import { formatRelativeTime } from "@/lib/formatTime";
import { trpc } from "@/lib/trpc";
import {
  ExternalLink,
  Heart,
  Instagram,
  Loader2,
  MapPin,
  MessageCircle,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { toast } from "sonner";

function followLabel(status: string, pending: boolean) {
  if (pending) return "…";
  if (status === "mutual") return "Amigos";
  if (status === "following") return "Seguindo";
  if (status === "follower") return "Seguir de volta";
  return "Seguir";
}

export default function PublicProfile() {
  const [, params] = useRoute("/profile/:username");
  const username = params?.username ?? "";
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: profile, isLoading, error } = trpc.profile.getByUsername.useQuery(
    { username },
    { enabled: !!username, retry: false }
  );

  const toggleFollow = trpc.follows.toggle.useMutation({
    onSuccess: () => {
      utils.profile.getByUsername.invalidate({ username });
      utils.follows.discover.invalidate();
      utils.follows.following.invalidate();
      utils.follows.followers.invalidate();
      utils.follows.stats.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <Card className="card-elegant text-center py-16 max-w-md mx-auto">
        <p className="text-muted-foreground mb-4">Perfil não encontrado.</p>
        <Link href="/community/feed">
          <Button variant="outline">Voltar à comunidade</Button>
        </Link>
      </Card>
    );
  }

  const displayName = profile.name || profile.username || "Creator";
  const isFollowing = profile.followStatus === "following" || profile.followStatus === "mutual";
  const locationLabel = [profile.city, profile.state].filter(Boolean).join(" — ");
  const isOnline = profile.isOnline;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Banner + avatar */}
      <Card className="card-elegant overflow-hidden p-0">
        <div className="relative aspect-[3/1] max-h-52 bg-gradient-to-r from-accent/30 via-secondary/30 to-accent/20">
          {profile.bannerImageUrl ? (
            <img src={profile.bannerImageUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : null}
        </div>
        <div className="px-5 pb-5 -mt-12 relative">
          <div className="relative inline-block">
            <UserAvatar
              src={profile.profileImageUrl}
              name={displayName}
              size={96}
              className="ring-4 ring-card border-2 border-background"
            />
            <span
              className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-card ${
                isOnline ? "bg-emerald-500" : "bg-muted-foreground/45"
              }`}
              title={isOnline ? "Online agora" : "Offline"}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{displayName}</h1>
              {profile.username && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
              {locationLabel && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {locationLabel}
                </p>
              )}
            </div>
            {profile.isSelf ? (
              <Button className="btn-primary" onClick={() => setLocation("/profile/edit")}>
                Editar perfil
              </Button>
            ) : (
              <Button
                variant={isFollowing ? "outline" : "default"}
                className={!isFollowing ? "btn-primary" : ""}
                disabled={toggleFollow.isPending}
                onClick={() => toggleFollow.mutate({ userId: profile.id })}
              >
                {toggleFollow.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : profile.followStatus === "mutual" ? (
                  <UserCheck className="h-4 w-4 mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {followLabel(profile.followStatus, toggleFollow.isPending)}
              </Button>
            )}
          </div>

          {profile.bio && (
            <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          )}

          {(profile.age || profile.platformObjective) && (
            <div className="mt-4 space-y-2 text-sm">
              {profile.age && (
                <p>
                  <span className="text-muted-foreground">Idade:</span>{" "}
                  <span className="font-medium">{profile.age} anos</span>
                </p>
              )}
              {profile.platformObjective && (
                <div>
                  <p className="text-muted-foreground mb-0.5">Objetivo / área</p>
                  <p className="leading-relaxed">{profile.platformObjective}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-5 text-sm">
            <span className="font-semibold">
              {profile.platformFollowers}{" "}
              <span className="font-normal text-muted-foreground">seguidores</span>
            </span>
            <span className="font-semibold">
              {profile.platformFollowing}{" "}
              <span className="font-normal text-muted-foreground">seguindo</span>
            </span>
            {profile.tiktokFollowers > 0 && (
              <span className="font-semibold">
                {profile.tiktokFollowers.toLocaleString("pt-BR")}{" "}
                <span className="font-normal text-muted-foreground">TikTok</span>
              </span>
            )}
            <span className="text-muted-foreground">
              Meta {formatGoalLabel(profile.targetFollowers)}
            </span>
          </div>

          {(profile.instagramHandle ||
            profile.tiktokHandle ||
            profile.youtubeHandle ||
            profile.twitterHandle ||
            profile.websiteUrl) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.instagramHandle && (
                <a
                  href={`https://instagram.com/${profile.instagramHandle.replace("@", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs rounded-full border px-3 py-1 hover:bg-muted"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  {profile.instagramHandle}
                </a>
              )}
              {profile.tiktokHandle && (
                <span className="inline-flex items-center gap-1 text-xs rounded-full border px-3 py-1 bg-muted/40">
                  TikTok {profile.tiktokHandle}
                </span>
              )}
              {profile.websiteUrl && (
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs rounded-full border px-3 py-1 hover:bg-muted"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Site
                </a>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Posts */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          Publicações
        </h2>
        {profile.posts.length === 0 ? (
          <Card className="card-elegant text-center py-10 text-muted-foreground text-sm">
            Nenhuma publicação ainda.
          </Card>
        ) : (
          <div className="space-y-3">
            {profile.posts.map(post => (
              <Card key={post.id} className="card-elegant p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {post.commentCount}
                  </span>
                  <span>{formatRelativeTime(post.createdAt)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
