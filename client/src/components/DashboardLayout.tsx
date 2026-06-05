import { AppLogo } from "@/components/AppLogo";
import { BackButton } from "@/components/BackButton";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { Link, useLocation } from "wouter";

const nav = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Missões", path: "/growth/missions", icon: Target },
  { label: "Conquistas", path: "/growth/achievements", icon: Award },
  { label: "Progresso", path: "/growth/progress", icon: TrendingUp },
  { label: "Cursos", path: "/courses/browse", icon: BookOpen },
  { label: "Loja", path: "/shop/browse", icon: ShoppingBag },
  { label: "Comunidade", path: "/community/feed", icon: Users },
  { label: "Analytics", path: "/analytics/overview", icon: BarChart3 },
  { label: "Perfil", path: "/profile/edit", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

  async function handleLogout() {
    setLocation("/");
    await logout();
  }

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
        <div className="px-2 py-4 mb-2">
          <AppLogo background="light" height={54} />
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
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start text-destructive" onClick={() => void handleLogout()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b h-14 px-4 gap-2">
          <div className="md:hidden min-w-0 max-w-[42%]">
            <AppLogo background="light" height={40} href={null} mobileFill />
          </div>
          <div className="hidden md:block flex-1" />
          <NotificationBell />
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => void handleLogout()}>
            Sair
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <BackButton fallback="/dashboard" className="mb-4" />
          {children}
        </main>
      </div>
    </div>
  );
}
