import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { StatBox } from "@/components/StatBox";
import { trpc } from "@/lib/trpc";
import { Loader2, ShoppingBag, TrendingUp, Users } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Analytics() {
  const { hasDbUser } = useAuth();
  const { data, isLoading } = trpc.analytics.overview.useQuery(undefined, {
    enabled: hasDbUser,
    retry: false,
  });

  if (!hasDbUser || isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const followers = data?.followers;
  const sales = data?.sales;
  const chartData =
    data?.followerChart?.length
      ? data.followerChart
      : followers
        ? [{ date: "Hoje", followers: followers.current, source: "manual" }]
        : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Evolução de seguidores no TikTok e vendas na plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox
          icon={<Users className="w-8 h-8" />}
          label="Seguidores TikTok"
          value={followers?.current.toLocaleString("pt-BR") ?? "0"}
        />
        <StatBox
          icon={<TrendingUp className="w-8 h-8" />}
          label="Faltam para 2K"
          value={followers?.remaining.toLocaleString("pt-BR") ?? "2.000"}
        />
        <StatBox
          icon={<ShoppingBag className="w-8 h-8" />}
          label="Vendas pagas"
          value={sales?.paidOrders ?? 0}
        />
        <StatBox
          icon={<ShoppingBag className="w-8 h-8" />}
          label="Receita (paga)"
          value={`R$ ${(sales?.totalRevenue ?? 0).toFixed(2)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-elegant p-6">
          <h3 className="text-lg font-semibold mb-4">Evolução de seguidores (TikTok)</h3>
          {chartData.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Conecte o TikTok em Progresso 2K ou salve atualizações para ver o gráfico.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="followers" stroke="hsl(var(--accent))" strokeWidth={2} />
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
        </Card>

        <Card className="card-elegant p-6">
          <h3 className="text-lg font-semibold mb-4">Vendas na plataforma</h3>
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
          </div>
          {sales?.recentOrders?.length ? (
            <ul className="space-y-2 text-sm border-t border-border pt-3">
              {sales.recentOrders.slice(0, 6).map(o => (
                <li key={o.id} className="flex justify-between gap-2">
                  <span className="truncate">{o.productTitle}</span>
                  <span className="shrink-0 text-muted-foreground">
                    R$ {parseFloat(o.totalPrice).toFixed(2)} · {o.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma venda ainda. Publique produtos na Loja e use o checkout Stripe.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
