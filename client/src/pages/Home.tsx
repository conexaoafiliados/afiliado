import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { ArrowRight, Zap, BookOpen, ShoppingBag, Users, TrendingUp, Award } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Conexões Creator</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button className="btn-primary">Dashboard</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="btn-primary">Entrar</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Sua Jornada para <span className="gradient-accent bg-clip-text text-transparent">2K Seguidores</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Uma plataforma completa para creators iniciantes crescerem, aprenderem e venderem. Gamificação, educação, comunidade e vendas em um único lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={getLoginUrl()}>
              <Button size="lg" className="btn-primary w-full sm:w-auto">
                Começar Agora
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Saiba Mais
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20">
          <FeatureCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Jornada Gamificada"
            description="Missões, conquistas e barra de progresso para alcançar 2K seguidores de forma divertida"
          />
          <FeatureCard
            icon={<BookOpen className="w-6 h-6" />}
            title="Educação Completa"
            description="Cursos e treinamentos voltados para creators iniciantes em conteúdo, crescimento e monetização"
          />
          <FeatureCard
            icon={<ShoppingBag className="w-6 h-6" />}
            title="Loja Integrada"
            description="Venda produtos digitais e físicos diretamente na plataforma com pagamento seguro"
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Comunidade Ativa"
            description="Conecte-se com outros creators, compartilhe experiências e cresça junto"
          />
          <FeatureCard
            icon={<Award className="w-6 h-6" />}
            title="Analytics Detalhado"
            description="Acompanhe seu progresso com métricas de engajamento, vendas e crescimento"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="PWA Instalável"
            description="Use offline, instale como app e acesse de qualquer dispositivo"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Pronto para crescer?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Junte-se a centenas de creators que já estão transformando suas carreiras na plataforma.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="btn-primary">
              Começar Gratuitamente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-20">
        <div className="container text-center text-muted-foreground">
          <p>&copy; 2026 Conexões Creator. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="card-elegant hover-lift">
      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
