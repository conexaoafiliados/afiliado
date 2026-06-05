import { PunishmentIntroCard } from "@/components/PunishmentIntroCard";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function Punishments() {
  const utils = trpc.useUtils();
  const { data: feed = [], isLoading, isError } = trpc.announcements.feed.useQuery({
    limit: 10,
    channel: "punicoes",
  });

  const post = feed[0];
  const usingMock = !post && (isError || !isLoading);

  const likePost = trpc.announcements.like.useMutation({
    onSuccess: () => {
      void utils.announcements.feed.invalidate({ limit: 10, channel: "punicoes" });
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <span className="text-2xl">❌</span> Punições
      </h1>

      <div className="relative overflow-hidden rounded-2xl border border-border shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-primary to-blue-900" />
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(135deg,transparent_40%,white_40%,white_60%,transparent_60%)] bg-[length:24px_24px]" />
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 h-72 w-72 rounded-full border-[40px] border-white/5" />

        <div className="relative px-6 py-10 sm:px-10 text-white text-center space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider opacity-80">Conexões Creators</p>
          <h2 className="text-2xl sm:text-3xl font-bold">Recebeu uma punição?</h2>
          <div className="mx-auto max-w-lg rounded-xl border border-white/25 bg-black/20 backdrop-blur-sm px-4 py-4 text-sm leading-relaxed">
            <strong>NÃO APAGUE O VÍDEO</strong> que recebeu a punição. Nós ajudamos com a contestação e defesa
            junto ao TikTok. A taxa de sucesso é alta quando a punição foi indevida.
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <PunishmentIntroCard
          announcementId={post?.id}
          likes={post?.likes ?? 54}
          liked={post?.liked}
          commentCount={post?.commentCount}
          useMock={usingMock}
          liking={likePost.isPending}
          onLike={() => post && likePost.mutate({ announcementId: post.id })}
        />
      )}
    </div>
  );
}
