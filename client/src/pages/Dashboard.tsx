import { useAuth } from "@/_core/hooks/useAuth";
import { BrandCard } from "@/components/BrandCard";
import { PreferencesCard } from "@/components/PreferencesCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatGoalLabel } from "@/lib/goals";
import { trpc } from "@/lib/trpc";
import { ArrowRight, GraduationCap, Loader2, Megaphone, MessageSquare, Store, Target, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

function ActionCard({
  href,
  icon,
  title,
  status,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  /** Texto de estado baseado em dados reais (ou estado vazio útil). */
  status: string;
}) {
  return (
    <Link href={href}>
      <a className="block h-full">
        <Card className="h-full p-4 transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between text-accent">
            {icon}
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-3 font-semibold">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{status}</p>
        </Card>
      </a>
    </Link>
  );
}

/** "Meu início": o que posso fazer agora para aprender, criar, participar ou vender. */
export default function Dashboard() {
  const { user, hasDbUser } = useAuth();
  const { data: home, isLoading } = trpc.movement.home.useQuery(undefined, { enabled: hasDbUser, retry: false });
  const { data: progress } = trpc.progress.get.useQuery(undefined, { enabled: hasDbUser, retry: false });

  // Permite links como /dashboard#interesses (a navegação SPA não rola sozinha até a âncora).
  useEffect(() => {
    if (!home || typeof window === "undefined" || !window.location.hash) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [home]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const firstName = (user.name ?? "").trim().split(/\s+/)[0] || "creator";
  const nextStep = home?.nextStep;
  const missions = home?.missions;
  const brandCount = home?.brandCount ?? 0;

  const followers = progress?.currentFollowers ?? 0;
  const target = progress?.targetFollowers ?? 2000;
  const pct = target > 0 ? Math.min(100, (followers / target) * 100) : 0;
  const followersSource = progress && "source" in progress ? progress.source : "manual";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Olá, {firstName}!</h1>
        <p className="text-muted-foreground mt-1">O que você quer fazer agora: aprender, criar, participar ou vender?</p>
      </div>

      {/* Próximo passo */}
      <Card className="p-5 sm:p-6 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
        {isLoading || !hasDbUser ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : nextStep ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Seu próximo passo</p>
              <h2 className="text-xl font-bold">{nextStep.title}</h2>
              <p className="text-sm text-muted-foreground max-w-xl">{nextStep.description}</p>
            </div>
            <Link href={nextStep.href}>
              <a className="shrink-0">
                <Button className="btn-primary w-full sm:w-auto">
                  {nextStep.cta}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nada pendente por aqui. Explore o menu para ver o que há de novo.</p>
        )}
      </Card>

      {/* Atalhos com estado real */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <ActionCard
          href="/aprender"
          icon={<GraduationCap className="h-6 w-6" />}
          title="Aprender"
          status="Trilhas e treinamentos disponíveis"
        />
        <ActionCard
          href="/marcas"
          icon={<Store className="h-6 w-6" />}
          title="Marcas e produtos"
          status={
            brandCount > 0
              ? `${brandCount} ${brandCount === 1 ? "marca publicada" : "marcas publicadas"}`
              : "Nenhuma marca publicada ainda"
          }
        />
        <ActionCard
          href="/campanhas"
          icon={<Megaphone className="h-6 w-6" />}
          title="Campanhas"
          status="Nenhuma campanha aberta agora"
        />
        <ActionCard
          href="/growth/missions"
          icon={<Target className="h-6 w-6" />}
          title="Missões"
          status={
            missions && missions.published > 0
              ? `${missions.published} ${missions.published === 1 ? "missão publicada" : "missões publicadas"}`
              : "Nenhuma missão publicada agora"
          }
        />
        <ActionCard
          href="/community/feed"
          icon={<MessageSquare className="h-6 w-6" />}
          title="Comunidade"
          status="Compartilhe aprendizados e conquistas"
        />
        <ActionCard
          href="/growth/progress"
          icon={<TrendingUp className="h-6 w-6" />}
          title="Minha evolução"
          status="Jornada de seguidores e conquistas"
        />
      </div>

      {/* Marcas publicadas */}
      {home && home.brands.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Marcas do movimento</h2>
            <Link href="/marcas">
              <a className="text-sm text-accent hover:underline">Ver todas</a>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {home.brands.slice(0, 3).map(brand => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        </section>
      )}

      {/* Jornada de seguidores como uma dimensão de evolução */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Minha evolução: seguidores</h2>
          <Link href="/growth/progress">
            <a className="text-sm text-accent hover:underline">Detalhes</a>
          </Link>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            {followers.toLocaleString("pt-BR")} / {target.toLocaleString("pt-BR")} seguidores
          </span>
          <span className="text-muted-foreground">{pct.toFixed(0)}% da meta de {formatGoalLabel(target)}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          {followersSource === "tiktok"
            ? "Número sincronizado com o TikTok."
            : "Número informado por você. Não é verificado pela equipe."}
        </p>
      </Card>

      <PreferencesCard id="interesses" />
    </div>
  );
}
