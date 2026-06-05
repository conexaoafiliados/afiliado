import { GroupMembersSidebar } from "@/components/GroupMembersSidebar";
import { GroupMessageItem } from "@/components/GroupMessageItem";
import { MentionTextarea } from "@/components/MentionTextarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_GROUP_MEMBERS, MOCK_GROUP_MESSAGES, type GroupMessage } from "@/data/mockGroupChat";
import { prepareImageForUpload } from "@/lib/prepareImage";
import { trpc } from "@/lib/trpc";
import { ArrowUp, ImageIcon, Loader2, Megaphone, Search, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function OpenGroup() {
  const [text, setText] = useState("");
  const [imageUpload, setImageUpload] = useState<{ base64: string; mime: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [search, setSearch] = useState("");
  const [membersOpen, setMembersOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
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
      clearImage();
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

  useEffect(() => {
    if (!membersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [membersOpen]);

  function clearImage() {
    setImageUpload(null);
    setImagePreview(null);
  }

  async function onImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessingImage(true);
    try {
      const result = await prepareImageForUpload(file, "post");
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setImagePreview(result.data.base64);
      setImageUpload(result.data);
    } finally {
      setProcessingImage(false);
      e.target.value = "";
    }
  }

  function handleSend() {
    if (!text.trim() && !imageUpload) return;
    if (usingMock) {
      toast.message("Demonstração", { description: "Envie mensagens após executar migration_grupo_aberto.sql" });
      return;
    }
    postMessage.mutate({
      content: text.trim(),
      channel: "grupo-aberto",
      imageBase64: imageUpload?.base64,
      imageMime: imageUpload?.mime,
    });
  }

  const canSend = (text.trim().length > 0 || imageUpload) && !postMessage.isPending && !processingImage;

  return (
    <div className="-mx-4 -mb-4 md:-mx-6 md:-mb-6 flex flex-col h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-7rem)] min-h-[420px] border border-border rounded-xl overflow-hidden bg-card/30">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Megaphone className="h-5 w-5 text-primary shrink-0" />
          <h1 className="font-bold truncate">Grupo Aberto</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-full max-w-[200px] hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="lg:hidden h-8 gap-1.5 px-2.5"
            onClick={() => setMembersOpen(true)}
            aria-label="Ver membros online e offline"
          >
            <Users className="h-4 w-4" />
            <span className="text-xs tabular-nums">{members.onlineCount}</span>
          </Button>
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
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Prévia da imagem"
                  className="h-20 w-20 object-cover rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm"
                  aria-label="Remover imagem"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageSelect}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-10 w-10"
                onClick={() => imageInputRef.current?.click()}
                disabled={processingImage}
                title="Anexar imagem da galeria ou arquivos"
              >
                {processingImage ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
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
                disabled={!canSend}
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
          className="hidden lg:flex"
        />
      </div>

      {membersOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar lista de membros"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMembersOpen(false)}
          />
          <GroupMembersSidebar
            members={members.members}
            onlineCount={members.onlineCount}
            totalCount={members.totalCount}
            className="fixed inset-y-0 right-0 z-50 flex w-[min(85vw,18rem)] shadow-xl bg-card lg:hidden"
            onClose={() => setMembersOpen(false)}
          />
        </>
      )}
    </div>
  );
}
