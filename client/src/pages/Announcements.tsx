import { AnnouncementCard } from "@/components/AnnouncementCard";
import { MentionTextarea } from "@/components/MentionTextarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOCK_ANNOUNCEMENTS } from "@/data/mockAnnouncements";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { trpc } from "@/lib/trpc";
import { Bell, ChevronDown, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type SortOption = "recent" | "popular";

export default function Announcements() {
  const { canPublishAnnouncements } = useAdminAccess();
  const isAdmin = canPublishAnnouncements;
  const [sort, setSort] = useState<SortOption>("recent");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const utils = trpc.useUtils();

  const { data: feed = [], isLoading, isError } = trpc.announcements.feed.useQuery({ limit: 50 });

  const createPost = trpc.announcements.post.useMutation({
    onSuccess: () => {
      setTitle("");
      setContent("");
      utils.announcements.feed.invalidate();
      toast.success("Aviso publicado!");
    },
    onError: err => toast.error(err.message),
  });

  const likePost = trpc.announcements.like.useMutation({
    onSuccess: () => utils.announcements.feed.invalidate(),
    onError: err => toast.error(err.message),
  });

  const usingMock = feed.length === 0 && (isError || !isLoading);
  const items = usingMock ? MOCK_ANNOUNCEMENTS : feed;

  const sortedItems = useMemo(() => {
    const list = [...items];
    if (sort === "popular") {
      list.sort((a, b) => b.likes - a.likes || +new Date(b.createdAt) - +new Date(a.createdAt));
    } else {
      list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return list;
  }, [items, sort]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-2xl">🔔</span> Avisos
        </h1>

        <div className="relative">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="appearance-none rounded-lg border border-border bg-background pl-3 pr-9 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <option value="recent">Mais recente</option>
            <option value="popular">Mais curtidos</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground shadow-sm">
        <div className="px-6 py-10 text-center space-y-4 relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-end pr-8">
            <Bell className="h-40 w-40" />
          </div>
          <p className="text-sm font-medium uppercase tracking-wider opacity-90 relative">Conexões Creators</p>
          <h2 className="text-3xl font-bold relative">Avisos do club</h2>
          <p className="text-sm max-w-lg mx-auto opacity-95 leading-relaxed relative bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
            Por aqui você fica por dentro de todas as novidades, campanhas, resultados e avisos importantes da
            equipe. Fique atento — conteúdo exclusivo para creators da comunidade.
          </p>
        </div>
      </div>

      {usingMock && (
        <p className="text-xs text-center text-muted-foreground bg-muted/40 rounded-lg py-2 px-3">
          Exibindo avisos de demonstração. Execute{" "}
          <code className="text-xs">migration_announcements.sql</code> no Supabase para dados reais.
        </p>
      )}

      {isAdmin && (
        <Card className="card-elegant space-y-4">
          <div>
            <h3 className="font-semibold">Publicar aviso</h3>
            <p className="text-xs text-muted-foreground mt-1">Somente administradores podem publicar aqui.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aviso-title">Título</Label>
            <Input
              id="aviso-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex.: 🏆 Resultado da gamificação"
              maxLength={500}
            />
          </div>
          <MentionTextarea
            value={content}
            onChange={setContent}
            placeholder="Escreva o conteúdo do aviso…"
            rows={5}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setTitle(""); setContent(""); }}>
              Cancelar
            </Button>
            <Button
              className="btn-primary"
              disabled={!title.trim() || !content.trim() || createPost.isPending}
              onClick={() =>
                createPost.mutate({ title: title.trim(), content: content.trim() })
              }
            >
              {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar aviso"}
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="space-y-5">
          {sortedItems.map(item => (
            <AnnouncementCard
              key={item.id}
              {...item}
              onLike={id => likePost.mutate({ announcementId: id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
