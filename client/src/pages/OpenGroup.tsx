import { GroupMembersSidebar } from "@/components/GroupMembersSidebar";
import { GroupMessageItem } from "@/components/GroupMessageItem";
import { MentionTextarea } from "@/components/MentionTextarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_GROUP_MEMBERS, MOCK_GROUP_MESSAGES, type GroupMessage } from "@/data/mockGroupChat";
import { trpc } from "@/lib/trpc";
import { ArrowUp, ImageIcon, Loader2, Megaphone, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function OpenGroup() {
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageField, setShowImageField] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: messages = [], isLoading, isError } = trpc.community.feed.useQuery(
    { channel: "grupo-aberto", limit: 100 },
    { refetchInterval: 20_000 }
  );

  const { data: membersData } = trpc.community.members.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const usingMock = messages.length === 0 && (isError || !isLoading);
  const rawMessages: GroupMessage[] = usingMock
    ? MOCK_GROUP_MESSAGES
    : messages.map(m => ({
        ...m,
        authorRole: (m as GroupMessage).authorRole ?? "user",
      }));

  const filtered = rawMessages.filter(
    m =>
      m.content.toLowerCase().includes(search.toLowerCase()) ||
      m.authorName.toLowerCase().includes(search.toLowerCase())
  );

  const members = membersData ?? MOCK_GROUP_MEMBERS;

  const postMessage = trpc.community.post.useMutation({
    onSuccess: () => {
      setText("");
      setImageUrl("");
      setShowImageField(false);
      void utils.community.feed.invalidate({ channel: "grupo-aberto" });
      toast.success("Mensagem enviada!");
    },
    onError: err => toast.error(err.message),
  });

  const likePost = trpc.community.like.useMutation({
    onSuccess: () => void utils.community.feed.invalidate({ channel: "grupo-aberto" }),
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [filtered.length, isLoading]);

  function handleSend() {
    if (!text.trim()) return;
    if (usingMock) {
      toast.message("Demonstração", { description: "Envie mensagens após executar migration_grupo_aberto.sql" });
      return;
    }
    postMessage.mutate({
      content: text.trim(),
      channel: "grupo-aberto",
      imageUrl: imageUrl.trim() || undefined,
    });
  }

  return (
    <div className="-mx-4 -mb-4 md:-mx-6 md:-mb-6 flex flex-col h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-7rem)] min-h-[420px] border border-border rounded-xl overflow-hidden bg-card/30">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Megaphone className="h-5 w-5 text-primary shrink-0" />
          <h1 className="font-bold truncate">Grupo Aberto</h1>
        </div>
        <div className="relative w-full max-w-[200px] hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="h-8 pl-8 text-sm"
          />
        </div>
      </header>

      {usingMock && (
        <p className="text-xs text-center text-muted-foreground bg-muted/40 py-1.5 px-3 shrink-0 border-b border-border">
          Modo demonstração — execute <code className="text-xs">migration_grupo_aberto.sql</code> no Supabase
        </p>
      )}

      <div className="flex flex-1 min-h-0">
        <div className="flex flex-1 flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto divide-y divide-border/50">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground px-4">
                {search ? "Nenhuma mensagem encontrada." : "Seja o primeiro a conversar no grupo!"}
              </div>
            ) : (
              filtered.map(msg => (
                <GroupMessageItem
                  key={msg.id}
                  message={msg}
                  onLike={id => likePost.mutate({ postId: id })}
                />
              ))
            )}
          </div>

          <div className="shrink-0 border-t border-border bg-card p-3 space-y-2">
            {showImageField && (
              <Input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="URL da imagem (opcional)"
                className="text-sm"
              />
            )}
            <div className="flex gap-2 items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-10 w-10"
                onClick={() => setShowImageField(v => !v)}
                title="Anexar imagem por URL"
              >
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </Button>
              <MentionTextarea
                value={text}
                onChange={setText}
                placeholder="Digite uma mensagem…"
                rows={1}
                className="min-h-[44px] max-h-32 resize-none flex-1"
                hideHint
                onSubmit={handleSend}
              />
              <Button
                type="button"
                size="icon"
                className="btn-primary shrink-0 h-10 w-10 rounded-full"
                disabled={!text.trim() || postMessage.isPending}
                onClick={handleSend}
              >
                {postMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              Enter para enviar · Shift+Enter para nova linha · Use @usuario para marcar alguém
            </p>
          </div>
        </div>

        <GroupMembersSidebar
          members={members.members}
          onlineCount={members.onlineCount}
          totalCount={members.totalCount}
        />
      </div>
    </div>
  );
}
