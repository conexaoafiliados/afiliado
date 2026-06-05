import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { formatLessonDuration, getTrackStats } from "@shared/learning/utils";
import { ChevronDown, Circle, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

type LearningContentListProps = {
  trackSlug: string;
  basePath: string;
  activeSlug?: string;
  showHeader?: boolean;
  showWelcome?: boolean;
  userName?: string | null;
};

function sectionMeta(lessons: { durationSeconds?: number | null }[]) {
  const lessonCount = lessons.length;
  const totalSeconds = lessons.reduce((acc, l) => acc + (l.durationSeconds ?? 0), 0);
  const durationLabel = totalSeconds > 0 ? formatLessonDuration(totalSeconds) : null;
  const parts = [`${lessonCount} ${lessonCount === 1 ? "aula" : "aulas"}`];
  if (durationLabel) parts.push(durationLabel);
  return parts.join(" • ");
}

export function LearningContentList({
  trackSlug,
  basePath,
  activeSlug,
  showHeader = true,
  showWelcome = false,
  userName,
}: LearningContentListProps) {
  const [location] = useLocation();
  const { data: track, isLoading, isError, refetch } = trpc.learning.track.useQuery({ trackSlug });

  const stats = useMemo(
    () => (track ? getTrackStats(track.sections) : null),
    [track]
  );

  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});

  const resolvedOpenSections = useMemo(() => {
    if (!track) return {};
    return Object.fromEntries(
      track.sections.map(s => [s.id, openSections[s.id] ?? true])
    );
  }, [track, openSections]);

  const allOpen = track ? track.sections.every(s => resolvedOpenSections[s.id]) : true;
  const onIndexPage = location === basePath;
  const firstLessonSlug = track?.sections[0]?.lessons[0]?.slug;

  function toggleSection(id: number) {
    setOpenSections(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  }

  function toggleAll() {
    if (!track) return;
    const next = !allOpen;
    setOpenSections(Object.fromEntries(track.sections.map(s => [s.id, next])));
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !track || !stats) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
        <p className="text-destructive">Não foi possível carregar o conteúdo.</p>
        <p className="text-xs text-muted-foreground">
          Verifique se a migration <code className="text-xs">migration_learning_content.sql</code> foi executada no Supabase.
        </p>
        <button type="button" onClick={() => refetch()} className="text-sm text-accent hover:underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  const completedCount = 0;
  const progressPct = stats.lessonCount > 0 ? Math.round((completedCount / stats.lessonCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">
            {track.emoji} {track.title}
          </h1>

          {showWelcome && onIndexPage && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">
                Boas-vindas{userName ? `, ${userName.split(" ")[0]}` : ""}.
              </h2>
              {firstLessonSlug && (
                <Link href={`${basePath}/${firstLessonSlug}`}>
                  <a className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                    Iniciar
                  </a>
                </Link>
              )}
            </div>
          )}

          {showWelcome && onIndexPage && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm">Progresso do curso</p>
                <span className="text-sm text-muted-foreground tabular-nums">{progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {completedCount} de {stats.lessonCount} aulas concluídas
              </p>
            </div>
          )}

          {onIndexPage && (
            <>
              <p className="text-lg font-semibold text-foreground/80">Conteúdo</p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {stats.sectionCount} seções • {stats.lessonCount} aulas • {stats.totalMinutes} min
                </p>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-muted-foreground hover:text-accent transition-colors"
                >
                  {allOpen ? "Ocultar todas as seções" : "Mostrar todas as seções"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="space-y-3">
        {track.sections.map(section => {
          const open = resolvedOpenSections[section.id] ?? true;
          return (
            <div key={section.id} className="rounded-xl border border-border overflow-hidden bg-card">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground">{section.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sectionMeta(section.lessons)}</p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    open && "rotate-180"
                  )}
                />
              </button>

              {open && (
                <div className="divide-y divide-border/60">
                  {section.lessons.map(lesson => {
                    const active = activeSlug === lesson.slug;
                    const duration = formatLessonDuration(lesson.durationSeconds);
                    const displayTitle = lesson.lessonLabel
                      ? `${lesson.lessonLabel}) ${lesson.title}`
                      : lesson.title;

                    return (
                      <Link key={lesson.slug} href={`${basePath}/${lesson.slug}`}>
                        <a
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                            active ? "bg-muted/60" : "hover:bg-muted/30"
                          )}
                        >
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                          <span className="flex-1 min-w-0 text-foreground/90">{displayTitle}</span>
                          {duration && (
                            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                              {duration}
                            </span>
                          )}
                        </a>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
