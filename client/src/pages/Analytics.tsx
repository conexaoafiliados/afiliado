import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatBox } from "@/components/StatBox";
import { formatGoalLabel } from "@/lib/goals";
import { trpc } from "@/lib/trpc";
import {
  Heart,
  Loader2,
  MessageCircle,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function orderStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    shipped: "Enviado",
    delivered: "Entregue",
  };
  return map[status] ?? status;
}

export default function Analytics() {
  const { hasDbUser } = useAuth();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.analytics.overview.useQuery(undefined, {
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
        {error?.message && (
          <p className="text-sm text-muted-foreground">{error.message}</p>
        )}
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  const followers = data?.followers;
  const sales = data?.sales;
  const community = data?.community;
  const chartData = data?.followerChart ?? [];
  const salesChart = sales?.salesChart ?? [];
  const hasFollowerChart = chartData.length >= 2;
  const hasSalesChart = salesChart.some(d => d.revenue > 0 || d.orders > 0);
  const growthPct = followers?.growthPct ?? 0;
  const growthPositive = (followers?.growth ?? 0) >= 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Evolução no TikTok, engajamento na comunidade e vendas na loja
          </p>
        </div>
        <Link href="/growth/progress">
          <Button variant="outline" size="sm">
            Atualizar seguidores
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox
          icon={<Users className="w-8 h-8" />}
          label="Seguidores TikTok"
          value={followers?.current.toLocaleString("pt-BR") ?? "0"}
          trend={
            chartData.length >= 2
              ? { value: Math.round(Math.abs(growthPct)), isPositive: growthPositive }
              : undefined
          }
        />
        <StatBox
          icon={<TrendingUp className="w-8 h-8" />}
          label={`Meta ${formatGoalLabel(followers?.target ?? 2000)}`}
          value={`${(followers?.progressPercentage ?? 0).toFixed(0)}%`}
        />
        <StatBox
          icon={<Users className="w-8 h-8" />}
          label="Seguidores na plataforma"
          value={community?.platformFollowers ?? 0}
        />
        <StatBox
          icon={<ShoppingBag className="w-8 h-8" />}
          label="Receita (vendas pagas)"
          value={`R$ ${(sales?.totalRevenue ?? 0).toFixed(2)}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatBox
          icon={<Heart className="w-8 h-8" />}
          label="Curtidas nos seus posts"
          value={community?.likesReceived ?? 0}
        />
        <StatBox
          icon={<MessageCircle className="w-8 h-8" />}
          label="Comentários recebidos"
          value={community?.commentsReceived ?? 0}
        />
        <StatBox
          icon={<ShoppingBag className="w-8 h-8" />}
          label="Vendas pagas"
          value={sales?.paidOrders ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-elegant p-6">
          <h3 className="text-lg font-semibold mb-4">Evolução de seguidores (TikTok)</h3>
          {!hasFollowerChart ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {followers?.current
                  ? "Salve mais uma atualização em Progresso para ver a curva de crescimento."
                  : "Conecte o TikTok ou informe seus seguidores em Progresso para começar."}
              </p>
              {followers?.current ? (
                <p className="text-2xl font-bold">{followers.current.toLocaleString("pt-BR")} seguidores</p>
              ) : null}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString("pt-BR"), "Seguidores"]}
                />
                <Line
                  type="monotone"
                  dataKey="followers"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          {data?.tiktok.linked && (
            <p className="text-xs text-muted-foreground mt-3">
              @{data.tiktok.handle} · última sync:{" "}
              {data.tiktok.lastSyncAt
                ? new Date(data.tiktok.lastSyncAt).toLocaleString("pt-BR")
                : "—"}
            </p>
          )}
          {followers?.growth !== undefined && chartData.length >= 2 && (
            <p className="text-xs text-muted-foreground mt-1">
              {growthPositive ? "+" : ""}
              {followers.growth.toLocaleString("pt-BR")} seguidores no período
            </p>
          )}
        </Card>

        <Card className="card-elegant p-6">
          <h3 className="text-lg font-semibold mb-4">Receita por dia (vendas)</h3>
          {!hasSalesChart ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma venda paga ainda. Publique produtos na Loja e use o checkout Stripe.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "revenue"
                      ? [`R$ ${value.toFixed(2)}`, "Receita"]
                      : [value, "Pedidos"]
                  }
                />
                <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-elegant p-6">
          <h3 className="text-lg font-semibold mb-4">Comunidade</h3>
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Posts publicados:</span>{" "}
              <strong>{community?.posts ?? 0}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">Curtidas recebidas:</span>{" "}
              <strong>{community?.likesReceived ?? 0}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">Comentários recebidos:</span>{" "}
              <strong>{community?.commentsReceived ?? 0}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">Seguidores na plataforma:</span>{" "}
              <strong>{community?.platformFollowers ?? 0}</strong>
            </p>
          </div>
          <Link href="/community/feed">
            <Button variant="outline" size="sm" className="mt-4">
              Ir para o feed
            </Button>
          </Link>
        </Card>

        <Card className="card-elegant p-6">
          <h3 className="text-lg font-semibold mb-4">Vendas na loja</h3>
          <div className="space-y-3 mb-4 text-sm">
            <p>
              <span className="text-muted-foreground">Pedidos totais:</span>{" "}
              <strong>{sales?.totalOrders ?? 0}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">Pagos / enviados:</span>{" "}
              <strong>{sales?.paidOrders ?? 0}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">Pendentes (valor):</span>{" "}
              <strong>R$ {(sales?.pendingRevenue ?? 0).toFixed(2)}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">Faltam para a meta:</span>{" "}
              <strong>{followers?.remaining.toLocaleString("pt-BR") ?? "—"}</strong> seguidores
            </p>
          </div>
          {sales?.recentOrders?.length ? (
            <ul className="space-y-2 text-sm border-t border-border pt-3">
              {sales.recentOrders.map(o => (
                <li key={o.id} className="flex justify-between gap-2">
                  <span className="truncate">{o.productTitle}</span>
                  <span className="shrink-0 text-muted-foreground">
                    R$ {parseFloat(o.totalPrice).toFixed(2)} · {orderStatusLabel(o.status)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground border-t border-border pt-3">
              Suas vendas aparecerão aqui quando alguém comprar seus produtos.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
