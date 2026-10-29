import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatBox } from "@/components/StatBox";
import { formatGoalLabel } from "@/lib/goals";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Eye, Heart, Loader2, MessageCircle, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function SourceBadge({
  kind,
}: {
  kind: "api" | "manual" | "community" | "disconnected";
}) {
  const label =
    kind === "api"
      ? "API oficial"
      : kind === "manual"
        ? "Informado por você"
        : kind === "community"
          ? "Comunidade do app"
          : "Não conectado";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        kind === "api" && "bg-emerald-100 text-emerald-800",
        kind === "manual" && "bg-amber-100 text-amber-800",
        kind === "community" && "bg-sky-100 text-sky-800",
        kind === "disconnected" && "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  );
}

function formatSync(value: Date | string | null | undefined) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("pt-BR");
}

function PlatformCard({
  title,
  linked,
  handle,
  lastSyncAt,
  stats,
  connectHref,
}: {
  title: string;
  linked: boolean;
  handle: string | null;
  lastSyncAt: Date | string | null;
  stats: { followers: number; likes: number; views: number; comments: number; mediaCount: number } | null;
  connectHref: string;
}) {
  return (
    <Card className="card-elegant p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {linked && handle ? (
            <p className="text-sm text-muted-foreground">@{handle}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Conecte a conta para puxar números oficiais</p>
          )}
        </div>
        <SourceBadge kind={linked && stats ? "api" : linked ? "api" : "disconnected"} />
      </div>

      {!linked ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            A autorização é feita pelo próprio creator. Sem conexão, não inventamos métricas.
          </p>
          <Link href={connectHref}>
            <Button size="sm" className="btn-primary">
              Conectar e autorizar
            </Button>
          </Link>
        </div>
      ) : !stats ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Conta ligada. Atualize em Progresso para gravar a primeira sync.</p>
          <Link href={connectHref}>
            <Button size="sm" variant="outline">
              Ir para sincronizar
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatBox icon={<Users className="w-6 h-6" />} label="Seguidores" value={stats.followers.toLocaleString("pt-BR")} />
            <StatBox icon={<Eye className="w-6 h-6" />} label="Views" value={stats.views.toLocaleString("pt-BR")} />
            <StatBox icon={<Heart className="w-6 h-6" />} label="Curtidas" value={stats.likes.toLocaleString("pt-BR")} />
            <StatBox
              icon={<MessageCircle className="w-6 h-6" />}
              label="Comentários"
              value={stats.comments.toLocaleString("pt-BR")}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.mediaCount > 0 ? `${stats.mediaCount} mídias consideradas · ` : ""}
            última sync: {formatSync(lastSyncAt) ?? "—"}
          </p>
        </>
      )}
    </Card>
  );
}

export default function Analytics() {
  const { hasDbUser } = useAuth();
  const { data, isLoading, isError, error, refetch } = trpc.analytics.overview.useQuery(undefined, {
    enabled: hasDbUser,
    retry: 1,
  });

  if (!hasDbUser || isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 max-w-lg mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-destructive">Não foi possível carregar os dados.</p>
        {error?.message && <p className="text-sm text-muted-foreground">{error.message}</p>}
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  const journey = data?.journey;
  const community = data?.community;
  const chartData = data?.followerChart ?? [];
  const hasFollowerChart = chartData.length >= 2;
  const growthPct = journey?.growthPct ?? 0;
  const growthPositive = (journey?.growth ?? 0) >= 0;
  const journeySource = journey?.source === "tiktok" || journey?.source === "instagram" ? "api" : "manual";

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Seguidores, views, curtidas e comentários — com a fonte de cada número explícita.
          </p>
        </div>
        <Link href="/growth/progress">
          <Button variant="outline" size="sm">
            Conectar / atualizar redes
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Jornada de seguidores</p>
            <SourceBadge kind={journeySource} />
          </div>
          <p className="text-3xl font-bold">{(journey?.current ?? 0).toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground">
            Meta {formatGoalLabel(journey?.target ?? 2000)} · {(journey?.progressPercentage ?? 0).toFixed(0)}%
          </p>
        </Card>
        <StatBox
          icon={<TrendingUp className="w-8 h-8" />}
          label={`Meta ${formatGoalLabel(journey?.target ?? 2000)}`}
          value={`${(journey?.progressPercentage ?? 0).toFixed(0)}%`}
          trend={
            chartData.length >= 2
              ? { value: Math.round(Math.abs(growthPct)), isPositive: growthPositive }
              : undefined
          }
        />
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Comunidade do app</p>
            <SourceBadge kind="community" />
          </div>
          <p className="text-3xl font-bold">{community?.platformFollowers ?? 0}</p>
          <p className="text-xs text-muted-foreground">Seguidores dentro da plataforma (não é Instagram/TikTok)</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformCard
          title="TikTok"
          linked={Boolean(data?.tiktok.linked)}
          handle={data?.tiktok.handle ?? null}
          lastSyncAt={data?.tiktok.lastSyncAt ?? null}
          stats={data?.tiktok.stats ?? null}
          connectHref="/growth/progress"
        />
        <PlatformCard
          title="Instagram"
          linked={Boolean(data?.instagram.linked)}
          handle={data?.instagram.handle ?? null}
          lastSyncAt={data?.instagram.lastSyncAt ?? null}
          stats={data?.instagram.stats ?? null}
          connectHref="/growth/progress"
        />
      </div>

      <Card className="card-elegant p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold">Evolução da jornada de seguidores</h3>
          <SourceBadge kind={journeySource} />
        </div>
        {!hasFollowerChart ? (
          <p className="text-sm text-muted-foreground">
            {journey?.current
              ? "Salve mais uma atualização em Progresso para ver a curva."
              : "Conecte TikTok/Instagram ou informe seguidores manualmente em Progresso."}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [value.toLocaleString("pt-BR"), "Seguidores"]} />
              <Line type="monotone" dataKey="followers" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
        {journey?.growth !== undefined && chartData.length >= 2 && (
          <p className="text-xs text-muted-foreground mt-2">
            {growthPositive ? "+" : ""}
            {journey.growth.toLocaleString("pt-BR")} seguidores no período
          </p>
        )}
      </Card>

      <Card className="card-elegant p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Engajamento na comunidade</h3>
          <SourceBadge kind="community" />
        </div>
        <p className="text-sm text-muted-foreground">
          Curtidas e comentários nos posts do feed do app — não confundir com Instagram/TikTok.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatBox icon={<Heart className="w-7 h-7" />} label="Curtidas nos seus posts" value={community?.likesReceived ?? 0} />
          <StatBox
            icon={<MessageCircle className="w-7 h-7" />}
            label="Comentários recebidos"
            value={community?.commentsReceived ?? 0}
          />
          <StatBox icon={<Users className="w-7 h-7" />} label="Posts publicados" value={community?.posts ?? 0} />
        </div>
        <Link href="/community/feed">
          <Button variant="outline" size="sm">
            Ir para o feed
          </Button>
        </Link>
      </Card>
    </div>
  );
}
