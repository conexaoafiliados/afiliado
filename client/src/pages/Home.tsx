import { useAuth } from "@/_core/hooks/useAuth";
import { AppLogo } from "@/components/AppLogo";
import { BrandCard } from "@/components/BrandCard";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BookOpen,
  Megaphone,
  PenSquare,
  Sprout,
  Store,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";

const PILLARS = [
  {
    icon: BookOpen,
    title: "Aprender",
    description: "Trilhas e treinamentos para evoluir no seu ritmo, de iniciante a quem já cria e vende.",
  },
  {
    icon: PenSquare,
    title: "Criar conteúdo",
    description: "Missões e orientações para produzir com a sua cara, sem copiar ninguém.",
  },
  {
    icon: Store,
    title: "Conhecer marcas e produtos",
    description: "Entenda cada marca do movimento, seus produtos e o que é informação aprovada.",
  },
  {
    icon: Megaphone,
    title: "Participar de campanhas",
    description: "Cada campanha tem seus próprios critérios, prazos e condições, informados antes de você se candidatar.",
  },
  {
    icon: TrendingUp,
    title: "Desenvolver vendas",
    description: "Ferramentas e aprendizados para quem quer indicar e vender em canais oficiais.",
  },
  {
    icon: Sprout,
    title: "Crescer com a comunidade",
    description: "Uma comunidade compartilhada para trocar aprendizados e celebrar conquistas reais.",
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: brands = [] } = trpc.brands.listPublished.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container flex items-center justify-between h-16">
          <AppLogo background="light" height={44} href={null} />
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button className="btn-primary">Meu início</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline">Entrar</Button>
                </Link>
                <Link href="/cadastro">
                  <Button className="btn-primary hidden sm:inline-flex">Criar conta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="container py-14 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">Movimento Conexões Creators</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-balance">
            Aprenda, crie, participe e cresça <span className="gradient-accent bg-clip-text text-transparent">junto</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            Uma comunidade de creators com uma conta, um perfil e várias marcas e produtos. Você escolhe o que quer
            fazer e evolui no seu tempo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={isAuthenticated ? "/dashboard" : "/cadastro"}>
              <Button size="lg" className="btn-primary w-full sm:w-auto">
                {isAuthenticated ? "Ir para Meu início" : "Criar minha conta"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Já tenho conta
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-16 max-w-5xl mx-auto">
          {PILLARS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="card-elegant">
              <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold mb-1.5">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {brands.length > 0 && (
        <section className="container pb-16">
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold">Marcas do movimento</h2>
              <p className="text-muted-foreground mt-1">Todas dentro da mesma comunidade.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map(brand => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-border/50 py-8">
        <div className="container text-center text-muted-foreground text-sm space-y-2 max-w-3xl">
          <div className="flex justify-center mb-4">
            <AppLogo background="light" height={44} href={null} />
          </div>
          <p>
            Oportunidades, condições de participação e eventuais comissões ou remunerações variam por campanha e não
            são garantidas.
          </p>
          <p>&copy; 2026 Conexões Creators. Todos os direitos reservados.</p>
          <p className="flex flex-wrap justify-center gap-4">
            <Link href="/termos" className="hover:text-foreground hover:underline">
              Termos de Serviço
            </Link>
            <Link href="/privacidade" className="hover:text-foreground hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
