import { FirstStepContentList } from "@/components/FirstStepContentList";
import { LessonCommentSection } from "@/components/LessonCommentSection";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatLessonDuration } from "@shared/learning/utils";
import {
  FIRST_STEP_MODULE,
  getFirstStepLesson,
  getFirstStepSectionForLesson,
} from "@shared/learning/firstStep";
import { Heart, Loader2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import NotFound from "./NotFound";

export default function FirstStepLesson() {
  const [, params] = useRoute("/vender/primeiro-passo/:slug");
  const slug = params?.slug ?? "";
  const lesson = getFirstStepLesson(slug);
  const section = getFirstStepSectionForLesson(slug);

  const utils = trpc.useUtils();
  const { data: engagement, isLoading: engagementLoading } = trpc.learning.engagement.useQuery(
    { lessonSlug: slug },
    { enabled: Boolean(lesson) }
  );

  const likeMutation = trpc.learning.like.useMutation({
    onSuccess: () => {
      utils.learning.engagement.invalidate({ lessonSlug: slug });
    },
  });

  if (!lesson || !section) {
    return <NotFound />;
  }

  const duration = formatLessonDuration(lesson.durationSeconds);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6 min-w-0">
        <div className="space-y-2">
          <Link href="/vender/primeiro-passo">
            <a className="text-sm text-muted-foreground hover:text-accent transition-colors">
              ← {FIRST_STEP_MODULE.emoji} {FIRST_STEP_MODULE.title}
            </a>
          </Link>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{section.title}</p>
          <h1 className="text-2xl font-bold tracking-tight">{lesson.title}</h1>
          {duration && <p className="text-sm text-muted-foreground">Duração: {duration}</p>}
        </div>

        <YouTubeEmbed videoIdOrUrl={lesson.youtubeVideoId} title={lesson.title} />

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={likeMutation.isPending || engagementLoading}
            onClick={() => likeMutation.mutate({ lessonSlug: slug })}
          >
            {likeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart
                className={`h-4 w-4 ${engagement?.liked ? "fill-rose-500 text-rose-500" : ""}`}
              />
            )}
            Curtir
            {engagement != null && (
              <span className="text-muted-foreground tabular-nums">({engagement.likes})</span>
            )}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <LessonCommentSection lessonSlug={slug} />
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-6 rounded-xl border border-border bg-card/50 p-4">
          <FirstStepContentList activeSlug={slug} showHeader={false} />
        </div>
      </aside>
    </div>
  );
}
