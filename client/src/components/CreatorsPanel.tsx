import { CreatorCard } from "@/components/CreatorCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Users } from "lucide-react";
import { useState } from "react";

type Tab = "discover" | "following" | "followers";

export function CreatorsPanel() {
  const [tab, setTab] = useState<Tab>("discover");
  const [creatorSearch, setCreatorSearch] = useState("");

  const { data: stats } = trpc.follows.stats.useQuery();
  const { data: discover = [], isLoading: loadingDiscover } = trpc.follows.discover.useQuery(
    { query: creatorSearch || undefined, limit: 24 },
    { enabled: tab === "discover" }
  );
  const { data: following = [], isLoading: loadingFollowing } = trpc.follows.following.useQuery(
    undefined,
    { enabled: tab === "following" }
  );
  const { data: followers = [], isLoading: loadingFollowers } = trpc.follows.followers.useQuery(
    undefined,
    { enabled: tab === "followers" }
  );

  const creators = tab === "discover" ? discover : tab === "following" ? following : followers;
  const isLoading =
    tab === "discover" ? loadingDiscover : tab === "following" ? loadingFollowing : loadingFollowers;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "discover", label: "Descobrir" },
    { id: "following", label: "Seguindo", count: stats?.following },
    { id: "followers", label: "Seguidores", count: stats?.followers },
  ];

  return (
    <Card className="card-elegant p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-bold">Creators</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Encontre outros creators, siga e construa sua rede — como no Instagram.
      </p>

      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <Button
            key={t.id}
            size="sm"
            variant={tab === t.id ? "default" : "outline"}
            className={tab === t.id ? "btn-primary" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 opacity-80">({t.count})</span>}
          </Button>
        ))}
      </div>

      {tab === "discover" && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por @usuario ou nome..."
            value={creatorSearch}
            onChange={e => setCreatorSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-7 w-7 animate-spin text-accent" />
        </div>
      ) : creators.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {tab === "discover" && "Nenhum creator encontrado."}
          {tab === "following" && "Você ainda não segue ninguém. Explore em Descobrir!"}
          {tab === "followers" && "Ninguém te segue ainda. Publique e interaja no feed!"}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {creators.map(creator => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      )}
    </Card>
  );
}
