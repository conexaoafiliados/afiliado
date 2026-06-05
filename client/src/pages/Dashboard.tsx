import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatBox } from "@/components/StatBox";
import { formatGoalLabel } from "@/lib/goals";
import { trpc } from "@/lib/trpc";
import { Users, Zap, TrendingUp, Award, BookOpen, ShoppingBag, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, hasDbUser } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: hasDbUser,
    retry: false,
  });
  const { data: progress } = trpc.progress.get.useQuery(undefined, {
    enabled: hasDbUser,
    retry: false,
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const targetFollowers = progress?.targetFollowers ?? 2000;
  const currentFollowers = progress?.currentFollowers ?? 0;
  const progressPercentage = progress?.progressPercentage
    ? parseFloat(progress.progressPercentage.toString())
    : targetFollowers > 0
      ? (currentFollowers / targetFollowers) * 100
      : 0;
  const followersRemaining = Math.max(0, targetFollowers - currentFollowers);
  const goalLabel = formatGoalLabel(targetFollowers);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">Bem-vindo, {user.name}!</h1>
          <p className="text-muted-foreground">
            Meta: {targetFollowers.toLocaleString("pt-BR")} seguidores no TikTok ({goalLabel})
            {profile?.tiktokHandle ? ` · @${profile.tiktokHandle}` : ""}
          </p>
        </div>
        <Link href="/profile/edit">
          <Button className="btn-primary">Editar Perfil</Button>
        </Link>
      </div>

      {/* Main Progress Card */}
      <Card className="card-elegant bg-gradient-to-br from-accent/5 to-secondary/5 border-accent/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Jornada para {goalLabel} no TikTok</h2>
            <p className="text-muted-foreground">
              {progress?.source === "tiktok"
                ? "Atualizado automaticamente do TikTok"
                : "Conecte o TikTok em Progresso para sync automático"}
            </p>
          </div>
          <TrendingUp className="w-12 h-12 text-accent opacity-20" />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">
              {currentFollowers.toLocaleString("pt-BR")} / {targetFollowers.toLocaleString("pt-BR")} seguidores
            </span>
            <span className="text-sm font-semibold text-accent">{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="stat-box">
            <div className="stat-value">{currentFollowers.toLocaleString()}</div>
            <div className="stat-label">Seguidores Atuais</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{followersRemaining.toLocaleString()}</div>
            <div className="stat-label">Faltam</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{progressPercentage.toFixed(0)}%</div>
            <div className="stat-label">Progresso</div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox
          icon={<Zap className="w-8 h-8" />}
          label="Missões Ativas"
          value="3"
          trend={{ value: 1, isPositive: true }}
        />

        <StatBox
          icon={<Award className="w-8 h-8" />}
          label="Conquistas"
          value="5"
          trend={{ value: 2, isPositive: true }}
        />

        <StatBox
          icon={<BookOpen className="w-8 h-8" />}
          label="Cursos em Progresso"
          value="2"
        />

        <StatBox
          icon={<ShoppingBag className="w-8 h-8" />}
          label="Produtos Vendidos"
          value={hasDbUser ? "—" : "0"}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-elegant">
          <h3 className="text-lg font-semibold mb-4">Próximas Ações</h3>
          <div className="space-y-3">
            <Link href="/growth/missions">
              <Button variant="outline" className="w-full justify-start">
                <Zap className="w-4 h-4 mr-2" />
                Aceitar Missões
              </Button>
            </Link>
            <Link href="/growth/achievements">
              <Button variant="outline" className="w-full justify-start">
                <Award className="w-4 h-4 mr-2" />
                Ver Conquistas
              </Button>
            </Link>
            <Link href="/growth/progress">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Atualizar Progresso
              </Button>
            </Link>
            <Link href="/courses/browse">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2" />
                Explorar Cursos
              </Button>
            </Link>
            <Link href="/shop/browse">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Vender Produtos
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="card-elegant">
          <h3 className="text-lg font-semibold mb-4">Comunidade</h3>
          <div className="space-y-3">
            <Link href="/community/feed">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Ver Feed
              </Button>
            </Link>
            <Link href="/analytics/overview">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Meus Analytics
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Users className="w-4 h-4 mr-2" />
              Eventos (Em breve)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
