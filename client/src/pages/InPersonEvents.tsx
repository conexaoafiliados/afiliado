import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Sparkles, Users } from "lucide-react";
import { Link } from "wouter";

export default function InPersonEvents() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <span className="text-2xl">🚐</span> Eventos Presenciais
      </h1>

      <div className="relative overflow-hidden rounded-3xl border border-border shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-primary to-amber-500" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_0%,transparent_50%),radial-gradient(circle_at_80%_80%,white_0%,transparent_40%)]" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-12 bottom-0 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative px-6 py-14 sm:px-10 sm:py-20 text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-sm font-medium mb-6 border border-white/20">
            <Sparkles className="h-4 w-4" />
            Em breve
          </div>

          <p className="text-sm sm:text-base font-medium uppercase tracking-[0.2em] opacity-90 mb-3">
            Conexões Creators
          </p>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight max-w-xl mx-auto drop-shadow-md">
            Você não pode perder este momento
          </h2>

          <p className="mt-5 text-base sm:text-lg max-w-md mx-auto opacity-95 leading-relaxed">
            Estamos preparando encontros presenciais incríveis — networking, aprendizado e experiências que só
            acontecem ao vivo. Fique de olho: em breve teremos novidades.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/20 backdrop-blur-sm px-4 py-2 border border-white/15">
              <MapPin className="h-4 w-4 shrink-0" />
              Cidades selecionadas
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-black/20 backdrop-blur-sm px-4 py-2 border border-white/15">
              <Users className="h-4 w-4 shrink-0" />
              Comunidade creator
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-black/20 backdrop-blur-sm px-4 py-2 border border-white/15">
              <Calendar className="h-4 w-4 shrink-0" />
              Agenda em breve
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 text-center space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed max-w-lg mx-auto">
          Enquanto isso, acompanhe os avisos oficiais e os treinamentos ao vivo para não ficar de fora de nada
          da comunidade.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/acessos/avisos">
            <a>
              <Button variant="outline" size="sm">
                Ver avisos
              </Button>
            </a>
          </Link>
          <Link href="/acessos/treinamentos">
            <a>
              <Button className="btn-primary" size="sm">
                Treinamentos ao vivo
              </Button>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
