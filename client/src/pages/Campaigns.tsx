import { Button } from "@/components/ui/button";
import { Gift, Sparkles, Star, TrendingUp, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Campaigns() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <span className="text-2xl">⭐</span> Campanhas Conexões Creators
      </h1>

      <div className="relative overflow-hidden rounded-3xl border border-border shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600" />
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top_left,white_0%,transparent_45%),radial-gradient(ellipse_at_bottom_right,white_0%,transparent_40%)]" />
        <div className="absolute top-8 left-8 h-24 w-24 rounded-full bg-yellow-300/30 blur-2xl" />
        <div className="absolute bottom-6 right-6 h-32 w-32 rounded-full bg-rose-400/25 blur-3xl" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <Star
              key={i}
              className="absolute text-white/20 fill-white/10"
              style={{
                top: `${15 + i * 14}%`,
                left: `${8 + i * 15}%`,
                width: 12 + (i % 3) * 8,
                height: 12 + (i % 3) * 8,
                transform: `rotate(${i * 25}deg)`,
              }}
            />
          ))}
        </div>

        <div className="relative px-6 py-14 sm:px-10 sm:py-20 text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-sm font-medium mb-6 border border-white/25">
            <Sparkles className="h-4 w-4" />
            Em breve
          </div>

          <p className="text-sm sm:text-base font-medium uppercase tracking-[0.2em] opacity-90 mb-3">
            Conexões Creators
          </p>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight max-w-2xl mx-auto drop-shadow-md">
            Grandes campanhas estão chegando
          </h2>

          <p className="mt-5 text-base sm:text-lg max-w-lg mx-auto opacity-95 leading-relaxed">
            Amostras gratuitas, comissões especiais e oportunidades exclusivas para creators da comunidade.
            Prepare-se — em breve você poderá se candidatar às próximas campanhas.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/20 backdrop-blur-sm px-4 py-2 border border-white/15">
              <Gift className="h-4 w-4 shrink-0" />
              Amostras grátis
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-black/20 backdrop-blur-sm px-4 py-2 border border-white/15">
              <TrendingUp className="h-4 w-4 shrink-0" />
              Comissões especiais
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-black/20 backdrop-blur-sm px-4 py-2 border border-white/15">
              <Zap className="h-4 w-4 shrink-0" />
              Vagas limitadas
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 text-center space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed max-w-lg mx-auto">
          Fique atento aos avisos e ao Grupo Aberto — quando as campanhas abrirem, avisaremos por lá primeiro.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/acessos/avisos">
            <a>
              <Button variant="outline" size="sm">
                Ver avisos
              </Button>
            </a>
          </Link>
          <Link href="/start/grupo-aberto">
            <a>
              <Button className="btn-primary" size="sm">
                Grupo Aberto
              </Button>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
