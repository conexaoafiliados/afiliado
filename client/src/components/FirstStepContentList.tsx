import { cn } from "@/lib/utils";
import {
  FIRST_STEP_MODULE,
  getFirstStepStats,
  type FirstStepSection,
} from "@shared/learning/firstStep";
import { formatLessonDuration } from "@shared/learning/utils";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

function sectionMeta(section: FirstStepSection) {
  const lessonCount = section.lessons.length;
  const totalSeconds = section.lessons.reduce((acc, l) => acc + (l.durationSeconds ?? 0), 0);
  const durationLabel = totalSeconds > 0 ? formatLessonDuration(totalSeconds) : null;
  const parts = [`${lessonCount} ${lessonCount === 1 ? "aula" : "aulas"}`];
  if (durationLabel) parts.push(durationLabel);
  return parts.join(" • ");
}

function SectionAccordion({
  section,
  open,
  onToggle,
  activeSlug,
}: {
  section: FirstStepSection;
  open: boolean;
  onToggle: () => void;
  activeSlug?: string;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground">{section.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sectionMeta(section)}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="divide-y divide-border/60">
          {section.lessons.map(lesson => {
            const active = activeSlug === lesson.slug;
            const duration = formatLessonDuration(lesson.durationSeconds);
            return (
              <Link key={lesson.slug} href={`/vender/primeiro-passo/${lesson.slug}`}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                    active ? "bg-muted/60" : "hover:bg-muted/30"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-base leading-none shrink-0">{lesson.icon ?? "▶️"}</span>
                  <span className="flex-1 min-w-0 truncate text-foreground/90">{lesson.title}</span>
                  {duration && (
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{duration}</span>
                  )}
                </a>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

type FirstStepContentListProps = {
  activeSlug?: string;
  showHeader?: boolean;
};

export function FirstStepContentList({ activeSlug, showHeader = true }: FirstStepContentListProps) {
  const [location] = useLocation();
  const stats = getFirstStepStats();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FIRST_STEP_MODULE.sections.map(s => [s.id, true]))
  );
  const allOpen = FIRST_STEP_MODULE.sections.every(s => openSections[s.id]);

  function toggleSection(id: string) {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleAll() {
    const next = !allOpen;
    setOpenSections(Object.fromEntries(FIRST_STEP_MODULE.sections.map(s => [s.id, next])));
  }

  const onIndexPage = location === "/vender/primeiro-passo";

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {FIRST_STEP_MODULE.emoji} {FIRST_STEP_MODULE.title}
          </h1>
          {onIndexPage && (
            <>
              <p className="text-lg font-semibold text-foreground/80">Conteúdo</p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
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
        {FIRST_STEP_MODULE.sections.map(section => (
          <SectionAccordion
            key={section.id}
            section={section}
            open={openSections[section.id] ?? true}
            onToggle={() => toggleSection(section.id)}
            activeSlug={activeSlug}
          />
        ))}
      </div>
    </div>
  );
}
