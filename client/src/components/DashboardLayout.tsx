import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/const";
import { getLoginUrl } from "@/lib/supabase";
import {
  Award,
  BarChart3,
  BookOpen,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  Target,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import { Link, useLocation } from "wouter";

const nav = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Missões", path: "/growth/missions", icon: Target },
  { label: "Conquistas", path: "/growth/achievements", icon: Award },
  { label: "Progresso 2K", path: "/growth/progress", icon: TrendingUp },
  { label: "Cursos", path: "/courses/browse", icon: BookOpen },
  { label: "Loja", path: "/shop/browse", icon: ShoppingBag },
  { label: "Comunidade", path: "/community/feed", icon: Users },
  { label: "Analytics", path: "/analytics/overview", icon: BarChart3 },
  { label: "Perfil", path: "/profile/edit", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold">Entre para continuar</h1>
          <p className="text-muted-foreground text-sm">Acesso ao painel requer login.</p>
          <a href={getLoginUrl()}>
            <Button className="btn-primary w-full">Entrar</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 p-4 gap-2">
        <div className="flex items-center gap-2 px-2 py-4 mb-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-sm leading-tight">{APP_NAME}</span>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map(item => {
            const active = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active ? "bg-accent/15 text-accent font-medium" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border pt-4 px-2">
          <p className="text-sm font-medium truncate">{user.name || "Creator"}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start text-destructive" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b h-14 px-4">
          <span className="font-semibold text-sm">{APP_NAME}</span>
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            Sair
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
