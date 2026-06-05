import { CreatorStoryBubble } from "@/components/CreatorStoryBubble";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";

type Tab = "discover" | "following" | "followers";

export function CreatorsPanel() {
  const [tab, setTab] = useState<Tab>("following");
  const [creatorSearch, setCreatorSearch] = useState("");

  const { data: stats } = trpc.follows.stats.useQuery();
  const { data: discover = [], isLoading: loadingDiscover } = trpc.follows.discover.useQuery(
    { query: creatorSearch || undefined, limit: 30 },
    { enabled: tab === "discover" }
  );
  const { data: following = [], isLoading: loadingFollowing } = trpc.follows.following.useQuery(
    { limit: 30 },
    { enabled: tab === "following" }
  );
  const { data: followers = [], isLoading: loadingFollowers } = trpc.follows.followers.useQuery(
    { limit: 30 },
    { enabled: tab === "followers" }
  );

  const creators = tab === "discover" ? discover : tab === "following" ? following : followers;
  const isLoading =
    tab === "discover" ? loadingDiscover : tab === "following" ? loadingFollowing : loadingFollowers;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "following", label: "Seguindo", count: stats?.following },
    { id: "discover", label: "Descobrir" },
    { id: "followers", label: "Seguidores", count: stats?.followers },
  ];

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                tab === t.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 ? ` · ${t.count}` : ""}
            </button>
          ))}
        </div>
      </div>

      {tab === "discover" && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar @usuario..."
            value={creatorSearch}
            onChange={e => setCreatorSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </div>
      ) : creators.length === 0 ? (
        <p className="text-xs text-muted-foreground px-1 py-2">
          {tab === "following" && "Você ainda não segue ninguém — veja em Descobrir."}
          {tab === "discover" && "Nenhum creator encontrado."}
          {tab === "followers" && "Ninguém te segue ainda."}
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory">
          {creators.map(creator => (
            <div key={creator.id} className="snap-start">
              <CreatorStoryBubble creator={creator} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
