import { TrainingEventCard } from "@/components/TrainingEventCard";
import {
  formatMonthGroup,
  MOCK_TRAINING_EVENTS,
  type TrainingEvent,
} from "@/data/mockTrainings";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type TimeFilter = "upcoming" | "all";
type CategoryFilter = "all" | "indicacao" | "estrategia";

const CATEGORY_PILLS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "indicacao", label: "Programa de Indicação" },
  { id: "estrategia", label: "Estratégia" },
];

export default function Trainings() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [registeringId, setRegisteringId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: events = [], isLoading, isError } = trpc.trainings.list.useQuery({
    upcomingOnly: timeFilter === "upcoming",
    category,
  });

  const register = trpc.trainings.register.useMutation({
    onSuccess: result => {
      utils.trainings.list.invalidate();
      toast.success(result.registered ? "Presença confirmada!" : "Confirmação cancelada.");
    },
    onError: err => toast.error(err.message),
    onSettled: () => setRegisteringId(null),
  });

  const usingMock = events.length === 0 && (isError || !isLoading);
  const rawItems: TrainingEvent[] = usingMock ? MOCK_TRAINING_EVENTS : events;

  const items = useMemo(() => {
    let list = [...rawItems];
    if (timeFilter === "upcoming") {
      const now = Date.now();
      list = list.filter(e => new Date(e.endDate ?? e.startDate).getTime() >= now);
    }
    if (category !== "all") {
      list = list.filter(e => e.category === category);
    }
    list.sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate));
    return list;
  }, [rawItems, timeFilter, category]);

  const nextEvent = items[0];
  const restEvents = items.slice(1);

  const groupedByMonth = useMemo(() => {
    const groups = new Map<string, TrainingEvent[]>();
    for (const event of restEvents) {
      const key = formatMonthGroup(event.startDate);
      const arr = groups.get(key) ?? [];
      arr.push(event);
      groups.set(key, arr);
    }
    return [...groups.entries()];
  }, [restEvents]);

  function handleRegister(eventId: number) {
    setRegisteringId(eventId);
    register.mutate({ eventId });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <span className="text-2xl">📅</span> Treinamentos e Reuniões
      </h1>

      <div className="rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground shadow-sm">
        <div className="px-6 py-10 text-center space-y-3 relative">
          <p className="text-xs font-medium uppercase tracking-wider opacity-90">Conexões Creators</p>
          <h2 className="text-2xl sm:text-3xl font-bold">Treinamentos exclusivos</h2>
          <p className="text-sm max-w-lg mx-auto opacity-95 leading-relaxed bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
            Treinamentos práticos e mentorias ao vivo para acelerar seus resultados no TikTok Shop. Confirme
            presença e receba lembrete antes de cada encontro.
          </p>
        </div>
      </div>

      {usingMock && (
        <p className="text-xs text-center text-muted-foreground bg-muted/40 rounded-lg py-2 px-3">
          Exibindo eventos de demonstração. Execute{" "}
          <code className="text-xs">migration_training_events.sql</code> no Supabase.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <select
            value={timeFilter}
            onChange={e => setTimeFilter(e.target.value as TimeFilter)}
            className="appearance-none rounded-full border border-border bg-background pl-4 pr-9 py-2 text-sm cursor-pointer hover:bg-muted/50"
          >
            <option value="upcoming">Futuros</option>
            <option value="all">Todos os eventos</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        {CATEGORY_PILLS.map(pill => (
          <button
            key={pill.id}
            type="button"
            onClick={() => setCategory(pill.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors",
              category === pill.id
                ? "border-foreground/20 bg-card font-medium shadow-sm"
                : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground text-sm">
          Nenhum evento encontrado para este filtro.
        </div>
      ) : (
        <div className="space-y-8">
          {nextEvent && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Próximo evento</h2>
              <TrainingEventCard
                event={nextEvent}
                featured
                registering={registeringId === nextEvent.id}
                onRegister={handleRegister}
              />
            </section>
          )}

          {groupedByMonth.map(([month, monthEvents]) => (
            <section key={month} className="space-y-3">
              <h2 className="text-lg font-semibold">{month}</h2>
              <div className="space-y-3">
                {monthEvents.map(event => (
                  <TrainingEventCard
                    key={event.id}
                    event={event}
                    registering={registeringId === event.id}
                    onRegister={handleRegister}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
