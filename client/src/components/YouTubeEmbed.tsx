import { parseYouTubeVideoId } from "@shared/learning/utils";

type YouTubeEmbedProps = {
  videoIdOrUrl?: string;
  title: string;
};

export function YouTubeEmbed({ videoIdOrUrl, title }: YouTubeEmbedProps) {
  const videoId = parseYouTubeVideoId(videoIdOrUrl);

  if (!videoId) {
    return (
      <div className="aspect-video w-full rounded-xl border border-dashed border-border bg-muted/40 flex flex-col items-center justify-center gap-2 text-center px-6">
        <span className="text-3xl">▶️</span>
        <p className="text-sm font-medium text-foreground">Vídeo em breve</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          O vídeo desta aula será publicado no YouTube em breve.
        </p>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-sm">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
