import { Card } from "@/components/ui/card";
import { StatBox } from "@/components/StatBox";
import { TrendingUp, Users, Eye, Heart, MessageSquare, Share2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const CHART_DATA = [
  { date: "01 Jun", followers: 1200, engagement: 45, views: 3200 },
  { date: "02 Jun", followers: 1350, engagement: 52, views: 3800 },
  { date: "03 Jun", followers: 1500, engagement: 48, views: 3500 },
  { date: "04 Jun", followers: 1680, engagement: 61, views: 4200 },
  { date: "05 Jun", followers: 1850, engagement: 58, views: 4100 },
  { date: "06 Jun", followers: 2000, engagement: 67, views: 4800 },
];

const ENGAGEMENT_DATA = [
  { name: "Curtidas", value: 1250 },
  { name: "Comentários", value: 450 },
  { name: "Compartilhamentos", value: 320 },
  { name: "Salvos", value: 680 },
];

export default function Analytics() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">Acompanhe seu crescimento e engajamento</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBox
          icon={<Users className="w-8 h-8" />}
          label="Total de Seguidores"
          value="2.000"
          trend={{ value: 15, isPositive: true }}
        />

        <StatBox
          icon={<Eye className="w-8 h-8" />}
          label="Visualizações (últimos 30 dias)"
          value="24.500"
          trend={{ value: 8, isPositive: true }}
        />

        <StatBox
          icon={<Heart className="w-8 h-8" />}
          label="Taxa de Engajamento"
          value="8.5%"
          trend={{ value: 2, isPositive: true }}
        />

        <StatBox
          icon={<MessageSquare className="w-8 h-8" />}
          label="Comentários"
          value="450"
          trend={{ value: 12, isPositive: true }}
        />

        <StatBox
          icon={<Share2 className="w-8 h-8" />}
          label="Compartilhamentos"
          value="320"
          trend={{ value: 5, isPositive: true }}
        />

        <StatBox
          icon={<TrendingUp className="w-8 h-8" />}
          label="Crescimento Mensal"
          value="+800"
          trend={{ value: 40, isPositive: true }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Followers Growth */}
        <Card className="card-elegant">
          <h3 className="text-lg font-semibold mb-4">Crescimento de Seguidores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: `1px solid var(--border)`,
                }}
              />
              <Line
                type="monotone"
                dataKey="followers"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ fill: "var(--accent)", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Engagement Over Time */}
        <Card className="card-elegant">
          <h3 className="text-lg font-semibold mb-4">Engajamento ao Longo do Tempo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: `1px solid var(--border)`,
                }}
              />
              <Bar dataKey="engagement" fill="var(--secondary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Views Growth */}
        <Card className="card-elegant">
          <h3 className="text-lg font-semibold mb-4">Visualizações</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: `1px solid var(--border)`,
                }}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="var(--secondary)"
                strokeWidth={2}
                dot={{ fill: "var(--secondary)", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Engagement Breakdown */}
        <Card className="card-elegant">
          <h3 className="text-lg font-semibold mb-4">Tipos de Engajamento</h3>
          <div className="space-y-4">
            {ENGAGEMENT_DATA.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm font-bold text-accent">{item.value}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${(item.value / 1250) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
