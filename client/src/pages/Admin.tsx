import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatBox } from "@/components/StatBox";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { formatRelativeTime } from "@/lib/formatTime";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  ADMIN_PERMISSION_GROUPS,
  ADMIN_PERMISSION_LABELS,
  ALL_ADMIN_PERMISSIONS,
  type AdminPermission,
} from "@shared/adminPermissions";
import {
  BarChart3,
  BookOpen,
  Loader2,
  Shield,
  ShoppingBag,
  Trash2,
  TrendingUp,
  UserCog,
  Users,
  Zap,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type TabId = "overview" | "users" | "growth" | "engagement" | "commerce" | "learning" | "moderation";

const TABS: { id: TabId; label: string; icon: typeof BarChart3; perm?: (a: ReturnType<typeof useAdminAccess>) => boolean }[] = [
  { id: "overview", label: "Visão geral", icon: BarChart3, perm: a => a.canViewAnalytics },
  { id: "users", label: "Usuários", icon: UserCog, perm: a => a.canManageUsers },
  { id: "growth", label: "Crescimento", icon: TrendingUp, perm: a => a.canViewAnalytics },
  { id: "engagement", label: "Engajamento", icon: Zap, perm: a => a.canViewAnalytics },
  { id: "commerce", label: "Loja", icon: ShoppingBag, perm: a => a.canShop || a.canViewAnalytics },
  { id: "learning", label: "Aprendizado", icon: BookOpen, perm: a => a.canLearning || a.canViewAnalytics },
  { id: "moderation", label: "Moderação", icon: Shield, perm: a => a.canModerate },
];

function OverviewTab() {
  const { data, isLoading } = trpc.admin.overview.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const p = data?.platform;
  const s = data?.sections;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox icon={<Users className="w-7 h-7" />} label="Usuários" value={p?.users ?? 0} />
        <StatBox icon={<Users className="w-7 h-7" />} label="Online agora" value={p?.onlineUsers ?? 0} />
        <StatBox icon={<Users className="w-7 h-7" />} label="Novos (7 dias)" value={p?.newUsersWeek ?? 0} />
        <StatBox icon={<TrendingUp className="w-7 h-7" />} label="Meta 2K+" value={p?.usersAt2k ?? 0} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox label="Posts no feed" value={p?.posts ?? 0} />
        <StatBox label="Comentários" value={p?.comments ?? 0} />
        <StatBox label="Curtidas" value={p?.likes ?? 0} />
        <StatBox label="Conexões (seguir)" value={p?.follows ?? 0} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox label="Pedidos pagos" value={p?.paidOrders ?? 0} />
        <StatBox label="Receita total" value={`R$ ${(p?.revenue ?? 0).toFixed(0)}`} />
        <StatBox label="Missões concluídas" value={p?.missionsCompleted ?? 0} />
        <StatBox label="Conquistas" value={p?.achievementsUnlocked ?? 0} />
      </div>

      <Card className="card-elegant p-5">
        <h3 className="font-semibold mb-4">Seções da plataforma (dados reais do banco)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <p>Missões: <strong>{s?.missions ?? 0}</strong></p>
          <p>Cursos: <strong>{s?.courses ?? 0}</strong></p>
          <p>Treinamentos: <strong>{s?.trainingEvents ?? 0}</strong></p>
          <p>Aulas (trilhas): <strong>{s?.learningLessons ?? 0}</strong></p>
          <p>Grupo aberto: <strong>{s?.grupoPosts ?? 0}</strong> posts</p>
          <p>Inscrições treinos: <strong>{p?.trainingRegistrations ?? 0}</strong></p>
          <p>Comentários em aulas: <strong>{p?.lessonComments ?? 0}</strong></p>
          <p>Avisos publicados: <strong>{p?.announcements ?? 0}</strong></p>
          <p>Média seguidores TikTok: <strong>{p?.avgFollowers ?? 0}</strong></p>
        </div>
      </Card>
    </div>
  );
}

function UsersTab({ canManageAdmins }: { canManageAdmins: boolean }) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftPerms, setDraftPerms] = useState<AdminPermission[]>([]);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.users.useQuery({ query: search || undefined, limit: 50 });

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      utils.admin.users.invalidate();
      toast.success("Papel atualizado");
    },
    onError: err => toast.error(err.message),
  });

  const setPermissions = trpc.admin.setPermissions.useMutation({
    onSuccess: () => {
      utils.admin.users.invalidate();
      setEditingId(null);
      toast.success("Permissões salvas");
    },
    onError: err => toast.error(err.message),
  });

  function openPermissions(userId: number, current: string[]) {
    setEditingId(userId);
    setDraftPerms(current.filter(p => ALL_ADMIN_PERMISSIONS.includes(p as AdminPermission)) as AdminPermission[]);
  }

  function togglePerm(p: AdminPermission) {
    setDraftPerms(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]));
  }

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          setSearch(query.trim());
        }}
      >
        <Input
          placeholder="Buscar nome, @usuario ou e-mail..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-accent" />
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.users ?? []).map(u => (
            <Card key={u.id} className="card-elegant p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <UserAvatar src={u.profileImageUrl} name={u.name || u.username || "?"} size={44} />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{u.name || u.username}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{u.username ?? "—"} · {u.city && u.state ? `${u.city}, ${u.state}` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {u.currentFollowers.toLocaleString("pt-BR")} seg. TikTok · {u.platformFollowers} na plataforma ·{" "}
                      {u.posts} posts ·{" "}
                      <span className={u.isOnline ? "text-emerald-600" : ""}>
                        {u.isOnline ? "online" : "offline"}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {u.username && (
                    <Link href={`/profile/${u.username}`}>
                      <Button size="sm" variant="outline">
                        Perfil
                      </Button>
                    </Link>
                  )}
                  {canManageAdmins && u.role !== "admin" && u.username?.toLowerCase() !== "conelheiros" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPermissions(u.id, u.permissions)}
                      >
                        Permissões
                      </Button>
                      <Button
                        size="sm"
                        className="btn-primary"
                        onClick={() => updateRole.mutate({ userId: u.id, role: "admin" })}
                        disabled={updateRole.isPending}
                      >
                        Tornar admin
                      </Button>
                    </>
                  )}
                  {u.role === "admin" && (
                    <span className="text-xs font-medium text-accent px-2 py-1 rounded-full bg-accent/10">
                      Admin{u.username?.toLowerCase() === "conelheiros" ? " principal" : ""}
                    </span>
                  )}
                  {canManageAdmins &&
                    u.role === "admin" &&
                    u.username?.toLowerCase() !== "conelheiros" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={updateRole.isPending}
                        onClick={() => {
                          if (confirm(`Remover admin de @${u.username}?`)) {
                            updateRole.mutate({ userId: u.id, role: "user" });
                          }
                        }}
                      >
                        Remover admin
                      </Button>
                    )}
                </div>
              </div>

              {editingId === u.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  {ADMIN_PERMISSION_GROUPS.map(group => (
                    <div key={group.title}>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">{group.title}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.keys.map(key => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => togglePerm(key)}
                            className={cn(
                              "text-xs rounded-full px-3 py-1 border transition-colors",
                              draftPerms.includes(key)
                                ? "bg-accent text-accent-foreground border-accent"
                                : "bg-muted/40 hover:bg-muted"
                            )}
                          >
                            {ADMIN_PERMISSION_LABELS[key]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="btn-primary"
                      disabled={setPermissions.isPending}
                      onClick={() => setPermissions.mutate({ userId: u.id, permissions: draftPerms })}
                    >
                      Salvar permissões
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
          <p className="text-xs text-muted-foreground text-center pt-2">
            {data?.total ?? 0} usuário(s) no total
          </p>
        </div>
      )}
    </div>
  );
}

function GrowthTab() {
  const { data = [], isLoading } = trpc.admin.growth.useQuery({ limit: 30 });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border">
            <th className="py-2 pr-4">Creator</th>
            <th className="py-2 pr-4">Seguidores</th>
            <th className="py-2 pr-4">Meta</th>
            <th className="py-2 pr-4">Progresso</th>
            <th className="py-2">Fonte</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id} className="border-b border-border/50">
              <td className="py-3 pr-4">
                {row.username ? (
                  <Link href={`/profile/${row.username}`} className="hover:underline font-medium">
                    {row.name || row.username}
                  </Link>
                ) : (
                  row.name
                )}
              </td>
              <td className="py-3 pr-4">{row.currentFollowers?.toLocaleString("pt-BR")}</td>
              <td className="py-3 pr-4">{row.targetFollowers?.toLocaleString("pt-BR")}</td>
              <td className="py-3 pr-4">{row.progressPercentage?.toFixed(0)}%</td>
              <td className="py-3 text-muted-foreground">{row.source ?? "manual"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EngagementTab() {
  const { data, isLoading } = trpc.admin.engagement.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="card-elegant p-5">
        <h3 className="font-semibold mb-3">Posts com mais curtidas</h3>
        <ul className="space-y-3 text-sm">
          {(data?.topPosts ?? []).map(p => (
            <li key={p.id} className="border-b border-border/50 pb-2 last:border-0">
              <p className="line-clamp-2">{p.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {p.authorName} · {p.likes} curtidas · {p.channel} · {formatRelativeTime(p.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="card-elegant p-5">
        <h3 className="font-semibold mb-3">Cadastros recentes</h3>
        <ul className="space-y-2 text-sm">
          {(data?.recentSignups ?? []).map(u => (
            <li key={u.id} className="flex justify-between gap-2">
              <span>
                {u.username ? (
                  <Link href={`/profile/${u.username}`} className="hover:underline">
                    {u.name || u.username}
                  </Link>
                ) : (
                  u.name
                )}
                {u.city && ` · ${u.city}/${u.state}`}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatRelativeTime(u.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function CommerceTab() {
  const { data, isLoading } = trpc.admin.commerce.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="card-elegant p-5">
        <h3 className="font-semibold mb-3">Top vendedores</h3>
        <ul className="space-y-2 text-sm">
          {(data?.topSellers ?? []).map(s => (
            <li key={s.userId} className="flex justify-between">
              <span>{s.sellerName || s.sellerUsername}</span>
              <span className="text-muted-foreground">
                R$ {s.revenue.toFixed(2)} · {s.paidOrders} vendas
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="card-elegant p-5">
        <h3 className="font-semibold mb-3">Pedidos recentes</h3>
        <ul className="space-y-2 text-sm">
          {(data?.recentOrders ?? []).map(o => (
            <li key={o.id} className="flex justify-between gap-2">
              <span className="truncate">{o.productTitle}</span>
              <span className="shrink-0 text-muted-foreground">
                R$ {parseFloat(o.totalPrice).toFixed(2)} · {o.status}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function LearningTab() {
  const { data, isLoading } = trpc.admin.learning.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="card-elegant p-5">
        <h3 className="font-semibold mb-3">Trilhas</h3>
        <ul className="space-y-2 text-sm">
          {(data?.tracks ?? []).map(t => (
            <li key={t.slug}>
              {t.emoji} {t.title}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="card-elegant p-5">
        <h3 className="font-semibold mb-3">Aulas mais curtidas</h3>
        <ul className="space-y-2 text-sm">
          {(data?.topLessons ?? []).map(l => (
            <li key={l.lessonSlug} className="flex justify-between">
              <span className="truncate">{l.lessonSlug}</span>
              <span className="text-muted-foreground shrink-0">
                {l.likes} ♥ · {l.comments} com.
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function ModerationTab() {
  const utils = trpc.useUtils();
  const { data: posts = [], isLoading } = trpc.admin.moderationPosts.useQuery({ limit: 30 });

  const deletePost = trpc.admin.deletePost.useMutation({
    onSuccess: () => {
      utils.admin.moderationPosts.invalidate();
      toast.success("Post removido");
    },
    onError: err => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map(p => (
        <Card key={p.id} className="card-elegant p-4">
          <p className="text-sm line-clamp-3 mb-2">{p.content}</p>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {p.authorName} (@{p.authorUsername}) · {p.channel} · {p.likes} curtidas · {p.commentCount}{" "}
              com. · {formatRelativeTime(p.createdAt)}
            </span>
            <Button
              size="sm"
              variant="destructive"
              disabled={deletePost.isPending}
              onClick={() => {
                if (confirm("Remover este post permanentemente?")) {
                  deletePost.mutate({ postId: p.id });
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Remover
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const access = useAdminAccess();
  const [tab, setTab] = useState<TabId>("overview");

  const visibleTabs = useMemo(
    () =>
      TABS.filter(t => {
        if (t.id === "overview") return access.isAdmin || access.canViewAnalytics;
        return !t.perm || t.perm(access);
      }),
    [access]
  );

  if (access.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!access.isStaff) {
    return (
      <Card className="card-elegant text-center py-16 max-w-md mx-auto">
        <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Você não tem acesso ao painel administrativo.</p>
        <Button variant="outline" onClick={() => setLocation("/dashboard")}>
          Voltar
        </Button>
      </Card>
    );
  }

  const activeTab = visibleTabs.some(t => t.id === tab) ? tab : visibleTabs[0]?.id ?? "overview";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Shield className="h-7 w-7 text-accent" />
          Administração
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {access.isSuperAdmin
            ? "Conta principal @conelheiros — controle total de admins e permissões"
            : access.isAdmin
              ? "Admin delegado — visão e ferramentas liberadas pelo administrador principal"
              : "Acesso delegado — use apenas as áreas liberadas para você"}
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {visibleTabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === t.id
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (access.isAdmin || access.canViewAnalytics) && <OverviewTab />}
      {activeTab === "users" && access.canManageUsers && (
        <UsersTab canManageAdmins={access.canManageAdmins} />
      )}
      {activeTab === "growth" && access.canViewAnalytics && <GrowthTab />}
      {activeTab === "engagement" && access.canViewAnalytics && <EngagementTab />}
      {activeTab === "commerce" && (access.canShop || access.canViewAnalytics) && <CommerceTab />}
      {activeTab === "learning" && (access.canLearning || access.canViewAnalytics) && <LearningTab />}
      {activeTab === "moderation" && access.canModerate && <ModerationTab />}
    </div>
  );
}
