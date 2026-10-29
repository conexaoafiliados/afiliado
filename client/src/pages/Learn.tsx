import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { FIRST_STEP_MODULE, getFirstStepStats } from "@shared/learning/firstStep";
import { getTrackStats } from "@shared/learning/utils";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Link } from "wouter";

function TrackLink({
  href,
  emoji,
  title,
  meta,
  description,
}: {
  href: string;
  emoji: string;
  title: string;
  meta?: string | null;
  description: string;
}) {
  return (
    <Link href={href}>
      <a className="block h-full">
        <Card className="h-full p-5 transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <span className="text-3xl leading-none" aria-hidden>
              {emoji}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <h2 className="mt-3 text-lg font-semibold">{title}</h2>
          {meta && <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>}
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </Card>
      </a>
    </Link>
  );
}

export default function Learn() {
  const firstStep = getFirstStepStats();
  const { data: deepDive } = trpc.learning.track.useQuery({ trackSlug: "aprofunde" }, { retry: false });
  const deepStats = deepDive ? getTrackStats(deepDive.sections) : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-accent" /> Aprender
        </h1>
        <p className="text-muted-foreground mt-1">
          Trilhas para entender o movimento, criar conteúdo e evoluir no seu ritmo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TrackLink
          href="/vender/primeiro-passo"
          emoji={FIRST_STEP_MODULE.emoji}
          title={FIRST_STEP_MODULE.title}
          meta={`${firstStep.lessonCount} ${firstStep.lessonCount === 1 ? "aula" : "aulas"}`}
          description="Comece por aqui: como usar o app e conhecer o time."
        />
        <TrackLink
          href="/vender/aprofunde"
          emoji={deepDive?.emoji ?? "📚"}
          title={deepDive?.title ?? "Se aprofunde"}
          meta={deepStats ? `${deepStats.lessonCount} ${deepStats.lessonCount === 1 ? "aula" : "aulas"}` : null}
          description="Aulas para aprofundar conteúdo, crescimento e vendas."
        />
        <TrackLink
          href="/acessos/treinamentos"
          emoji="📅"
          title="Treinamentos e reuniões"
          description="Encontros ao vivo e agenda de treinamentos da comunidade."
        />
      </div>
    </div>
  );
}
