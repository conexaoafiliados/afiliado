import { AchievementBadge } from "@/components/AchievementBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatGoalLabel } from "@/lib/goals";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2, PartyPopper, Trophy } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function Achievements() {
  const toastedRef = useRef<Set<string>>(new Set());
  const { data, isLoading } = trpc.achievements.mine.useQuery(undefined, {
    refetchOnMount: "always",
  });

  const items = data?.items ?? [];
  const unlockedCount = items.filter(a => a.unlocked).length;
  const unlockedFollower = items.filter(a => a.isFollowerMilestone && a.unlocked);
  const nextFollower = items.find(a => a.isFollowerMilestone && !a.unlocked);
  const currentFollowers = data?.currentFollowers ?? 0;

  useEffect(() => {
    if (!data?.newlyUnlocked?.length) return;
    for (const title of data.newlyUnlocked) {
      if (toastedRef.current.has(title)) continue;
      toastedRef.current.add(title);
      toast.success(`Parabéns! Conquista desbloqueada: ${title}`, { duration: 5000 });
    }
  }, [data?.newlyUnlocked]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Conquistas</h1>
          <p className="text-muted-foreground">
            Desbloqueie marcos conforme seus seguidores crescem — você tem{" "}
            <strong>{currentFollowers.toLocaleString("pt-BR")}</strong> no TikTok
          </p>
        </div>
        <Card className="px-4 py-3 flex items-center gap-3 border-accent/20">
          <Trophy className="h-8 w-8 text-accent" />
          <div>
            <p className="text-2xl font-bold">
              {unlockedCount}/{items.length}
            </p>
            <p className="text-xs text-muted-foreground">conquistas</p>
          </div>
        </Card>
      </div>

      {unlockedFollower.length > 0 && (
        <Card className="card-elegant border-accent/30 bg-gradient-to-br from-accent/10 to-secondary/5 p-5">
          <div className="flex gap-3 items-start">
            <PartyPopper className="h-8 w-8 text-accent shrink-0" />
            <div>
              <h2 className="text-lg font-bold mb-1">Parabéns pelas metas atingidas!</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Você já desbloqueou {unlockedFollower.length} conquista
                {unlockedFollower.length !== 1 ? "s" : ""} de seguidores:
              </p>
              <div className="flex flex-wrap gap-2">
                {unlockedFollower.map(a => (
                  <span
                    key={a.id}
                    className="inline-flex items-center rounded-full bg-accent/15 text-accent px-3 py-1 text-xs font-semibold"
                  >
                    {a.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {nextFollower && (
        <Card className="px-4 py-3 border-dashed">
          <p className="text-sm text-muted-foreground">
            Próxima conquista de seguidores:{" "}
            <strong className="text-foreground">{nextFollower.title}</strong>
            {nextFollower.followerThreshold != null && (
              <>
                {" "}
                — faltam{" "}
                <strong className="text-accent">
                  {Math.max(0, nextFollower.followerThreshold - currentFollowers).toLocaleString("pt-BR")}
                </strong>{" "}
                (meta {formatGoalLabel(nextFollower.followerThreshold)})
              </>
            )}
          </p>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : items.length === 0 ? (
        <Card className="card-elegant text-center py-12 text-muted-foreground text-sm">
          Nenhuma conquista cadastrada ainda.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(a => (
            <AchievementBadge
              key={a.id}
              title={a.title}
              description={a.description}
              unlocked={a.unlocked}
              unlockedAt={a.unlockedAt}
              congrats={a.isFollowerMilestone && a.unlocked}
            />
          ))}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Link href="/growth/progress">
          <Button variant="outline">Ver progresso</Button>
        </Link>
        <Link href="/growth/missions">
          <Button className="btn-primary">Ir para missões</Button>
        </Link>
      </div>
    </div>
  );
}
