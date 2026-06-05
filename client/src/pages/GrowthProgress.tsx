import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Loader2, RefreshCw, Target, TrendingUp, Unplug } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function GrowthProgress() {
  const { hasDbUser } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: progress, isLoading } = trpc.progress.get.useQuery(undefined, {
    enabled: hasDbUser,
    retry: false,
  });
  const { data: tiktok } = trpc.tiktok.status.useQuery(undefined, {
    enabled: hasDbUser,
    retry: false,
  });

  const update = trpc.progress.update.useMutation({
    onSuccess: () => {
      utils.progress.get.invalidate();
      utils.analytics.overview.invalidate();
      toast.success("Progresso atualizado!");
    },
    onError: () => toast.error("Não foi possível salvar. Verifique o banco."),
  });

  const completeConnect = trpc.tiktok.completeConnect.useMutation({
    onSuccess: data => {
      utils.progress.get.invalidate();
      utils.tiktok.status.invalidate();
      utils.analytics.overview.invalidate();
      toast.success(`TikTok conectado! ${data.followers.toLocaleString("pt-BR")} seguidores`);
      setLocation("/growth/progress");
    },
    onError: err => toast.error(err.message),
  });

  const syncNow = trpc.tiktok.syncNow.useMutation({
    onSuccess: data => {
      utils.progress.get.invalidate();
      utils.analytics.overview.invalidate();
      toast.success(`Atualizado: ${data.followers.toLocaleString("pt-BR")} seguidores no TikTok`);
    },
    onError: err => toast.error(err.message),
  });

  const disconnect = trpc.tiktok.disconnect.useMutation({
    onSuccess: () => {
      utils.tiktok.status.invalidate();
      toast.success("TikTok desconectado");
    },
  });

  const [followers, setFollowers] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    const state = params.get("state");
    completeConnect.mutate({ code, state: state ?? undefined });
    window.history.replaceState(null, "", "/growth/progress");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- OAuth callback once
  }, []);

  async function handleConnectTikTok() {
    try {
      setConnecting(true);
      const { url } = await utils.tiktok.getConnectUrl.fetch();
      window.location.href = url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível abrir o TikTok";
      toast.error(msg);
      setConnecting(false);
    }
  }

  const current = progress?.currentFollowers ?? 0;
  const target = progress?.targetFollowers ?? 2000;
  const remaining = Math.max(0, target - current);
  const pct = progress?.progressPercentage
    ? parseFloat(String(progress.progressPercentage))
    : (current / target) * 100;

  const milestones = [
    { label: "500", value: 500, done: current >= 500 },
    { label: "1K", value: 1000, done: current >= 1000 },
    { label: "2K", value: 2000, done: current >= 2000 },
  ];

  if (isLoading && hasDbUser) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Progresso — 2K no TikTok</h1>
        <p className="text-muted-foreground">
          Meta: {target.toLocaleString("pt-BR")} seguidores no TikTok · faltam{" "}
          <strong className="text-accent">{remaining.toLocaleString("pt-BR")}</strong>
        </p>
      </div>

      <Card className="card-elegant border-accent/20 p-6">
        <h2 className="text-xl font-bold mb-2">Conectar TikTok</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Com a API oficial do TikTok, os seguidores são lidos automaticamente e o gráfico de evolução
          é atualizado.
        </p>

        {!tiktok?.configured ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Admin: configure <code className="text-xs">TIKTOK_CLIENT_KEY</code> e{" "}
            <code className="text-xs">TIKTOK_CLIENT_SECRET</code> na Vercel (developers.tiktok.com).
            Redirect URI: <strong>{window.location.origin}/growth/progress</strong>
          </p>
        ) : tiktok.linked ? (
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium">
              @{tiktok.handle ?? "conectado"} · {tiktok.displayName}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={syncNow.isPending}
              onClick={() => syncNow.mutate()}
            >
              {syncNow.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar do TikTok
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => disconnect.mutate()}
            >
              <Unplug className="h-4 w-4 mr-2" />
              Desconectar
            </Button>
          </div>
        ) : (
          <Button className="btn-primary" disabled={connecting} onClick={handleConnectTikTok}>
            {connecting ? "Abrindo TikTok…" : "Conectar conta TikTok"}
          </Button>
        )}

        {completeConnect.isPending && (
          <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Finalizando conexão com o TikTok…
          </p>
        )}
      </Card>

      <Card className="card-elegant bg-gradient-to-br from-accent/5 to-secondary/5 border-accent/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Barra de progresso</h2>
          <TrendingUp className="h-10 w-10 text-accent opacity-30" />
        </div>
        <div className="flex justify-between text-sm font-medium mb-2">
          <span>
            {current.toLocaleString("pt-BR")} / {target.toLocaleString("pt-BR")} seguidores
            {progress?.source === "tiktok" && (
              <span className="text-accent ml-2">· via TikTok</span>
            )}
          </span>
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
        <h3 className="font-semibold mb-1">Atualização manual</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Use se ainda não conectou o TikTok ou a API estiver em configuração.
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="followers">Seguidores atuais (TikTok)</Label>
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
            onClick={() => update.mutate({ currentFollowers: parseInt(followers, 10) })}
          >
            {update.isPending ? "Salvando…" : "Salvar progresso"}
          </Button>
        </div>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Link href="/analytics/overview">
          <Button variant="outline">Vendas e analytics</Button>
        </Link>
        <Link href="/growth/missions">
          <Button variant="outline">Missões</Button>
        </Link>
        <Link href="/dashboard">
          <Button className="btn-primary">Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
