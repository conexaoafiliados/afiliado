import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2, Target, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function GrowthProgress() {
  const utils = trpc.useUtils();
  const { data: progress, isLoading } = trpc.progress.get.useQuery();
  const update = trpc.progress.update.useMutation({
    onSuccess: () => {
      utils.progress.get.invalidate();
      toast.success("Progresso atualizado!");
    },
    onError: () => toast.error("Não foi possível salvar. Verifique o banco."),
  });

  const [followers, setFollowers] = useState("");

  const current = progress?.currentFollowers ?? 0;
  const target = progress?.targetFollowers ?? 2000;
  const pct = progress?.progressPercentage
    ? parseFloat(String(progress.progressPercentage))
    : (current / target) * 100;

  const milestones = [
    { label: "500", value: 500, done: current >= 500 },
    { label: "1K", value: 1000, done: current >= 1000 },
    { label: "2K", value: 2000, done: current >= 2000 },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Progresso — 2K Seguidores</h1>
        <p className="text-muted-foreground">Acompanhe e atualize sua jornada de crescimento</p>
      </div>

      <Card className="card-elegant bg-gradient-to-br from-accent/5 to-secondary/5 border-accent/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Barra de progresso</h2>
          <TrendingUp className="h-10 w-10 text-accent opacity-30" />
        </div>
        <div className="flex justify-between text-sm font-medium mb-2">
          <span>{current.toLocaleString("pt-BR")} / {target.toLocaleString("pt-BR")} seguidores</span>
          <span className="text-accent">{pct.toFixed(1)}%</span>
        </div>
        <div className="progress-bar mb-8">
          <div className="progress-bar-fill" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {milestones.map(m => (
            <div
              key={m.value}
              className={`rounded-lg p-4 text-center border ${
                m.done ? "border-accent bg-accent/10" : "border-border bg-muted/30"
              }`}
            >
              <Target className={`h-5 w-5 mx-auto mb-2 ${m.done ? "text-accent" : "text-muted-foreground"}`} />
              <p className="font-bold">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.done ? "Atingido" : "Em breve"}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="card-elegant p-6 max-w-md">
        <h3 className="font-semibold mb-4">Atualizar seguidores</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="followers">Seguidores atuais</Label>
            <Input
              id="followers"
              type="number"
              min={0}
              placeholder={String(current)}
              value={followers}
              onChange={e => setFollowers(e.target.value)}
            />
          </div>
          <Button
            className="btn-primary w-full"
            disabled={update.isPending || !followers}
            onClick={() =>
              update.mutate({ currentFollowers: parseInt(followers, 10) })
            }
          >
            {update.isPending ? "Salvando…" : "Salvar progresso"}
          </Button>
        </div>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Link href="/growth/missions">
          <Button variant="outline">Missões</Button>
        </Link>
        <Link href="/growth/achievements">
          <Button variant="outline">Conquistas</Button>
        </Link>
        <Link href="/dashboard">
          <Button className="btn-primary">Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
