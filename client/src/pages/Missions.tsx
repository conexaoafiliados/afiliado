import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MissionCard } from "@/components/MissionCard";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const FALLBACK = [
  { id: 1, title: "Poste seu primeiro conteúdo", description: "Publique na comunidade", category: "growth" as const, difficulty: "easy" as const, reward: 50, status: "pending" as const },
  { id: 2, title: "Alcance 100 seguidores", description: "Atualize seu progresso", category: "growth" as const, difficulty: "medium" as const, reward: 200, status: "pending" as const },
  { id: 3, title: "Complete um curso", description: "Matricule-se em um curso", category: "learning" as const, difficulty: "hard" as const, reward: 300, status: "pending" as const },
];

export default function Missions() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.missions.feed.useQuery();
  const accept = trpc.missions.accept.useMutation({
    onSuccess: () => {
      utils.missions.feed.invalidate();
      toast.success("Missão aceita!");
    },
  });

  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");

  const missions = (data && data.length > 0 ? data : FALLBACK).map(m => ({
    id: m.id,
    title: m.title,
    description: m.description ?? "",
    category: m.category,
    difficulty: m.difficulty,
    reward: m.reward,
    status: m.status,
  }));

  const filtered = missions.filter(m => filter === "all" || m.status === filter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Missões</h1>
        <p className="text-muted-foreground">Complete missões para ganhar pontos e desbloqueios</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "in_progress", "completed"] as const).map(status => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            onClick={() => setFilter(status)}
            className={filter === status ? "btn-primary" : ""}
          >
            {status === "all" && "Todas"}
            {status === "pending" && "Pendentes"}
            {status === "in_progress" && "Em progresso"}
            {status === "completed" && "Concluídas"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(mission => (
            <MissionCard
              key={mission.id}
              {...mission}
              onAccept={id => accept.mutate({ missionId: id })}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <Card className="card-elegant text-center py-12">
          <p className="text-muted-foreground mb-4">Nenhuma missão nesta categoria</p>
          <Button variant="outline" onClick={() => setFilter("all")}>Ver todas</Button>
        </Card>
      )}
    </div>
  );
}
