import { AchievementBadge } from "@/components/AchievementBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2, Trophy } from "lucide-react";

const DEMO_ACHIEVEMENTS = [
  { id: 1, title: "Primeiro Passo", description: "Complete sua primeira missão", unlocked: true, unlockedAt: new Date() },
  { id: 2, title: "500 Seguidores", description: "Alcance 500 seguidores na jornada", unlocked: false, unlockedAt: null },
  { id: 3, title: "1K Club", description: "Chegue a 1.000 seguidores", unlocked: false, unlockedAt: null },
  { id: 4, title: "Creator 2K", description: "Meta principal: 2.000 seguidores", unlocked: false, unlockedAt: null },
  { id: 5, title: "Vendedor", description: "Realize sua primeira venda na loja", unlocked: false, unlockedAt: null },
  { id: 6, title: "Estudioso", description: "Conclua um curso completo", unlocked: false, unlockedAt: null },
];

export default function Achievements() {
  const { data, isLoading } = trpc.achievements.mine.useQuery();
  const items = data && data.length > 0 ? data : DEMO_ACHIEVEMENTS;
  const unlockedCount = items.filter(a => a.unlocked).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Conquistas</h1>
          <p className="text-muted-foreground">
            Desbloqueie marcos na sua jornada até 2k seguidores
          </p>
        </div>
        <Card className="px-4 py-3 flex items-center gap-3 border-accent/20">
          <Trophy className="h-8 w-8 text-accent" />
          <div>
            <p className="text-2xl font-bold">{unlockedCount}/{items.length}</p>
            <p className="text-xs text-muted-foreground">conquistas</p>
          </div>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(a => (
            <AchievementBadge
              key={a.id}
              title={a.title}
              description={a.description}
              unlocked={a.unlocked}
              unlockedAt={a.unlockedAt}
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
