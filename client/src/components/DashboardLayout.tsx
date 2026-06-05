import { AppLogo } from "@/components/AppLogo";
import { BackButton } from "@/components/BackButton";
import { NotificationBell } from "@/components/NotificationBell";
import { SidebarNav } from "@/components/SidebarNav";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/lib/supabase";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

function SidebarFooter({
  name,
  email,
  onLogout,
}: {
  name?: string | null;
  email?: string | null;
  onLogout: () => void;
}) {
  return (
    <div className="border-t border-border pt-4 px-2 shrink-0">
      <p className="text-sm font-medium truncate">{name || "Creator"}</p>
      <p className="text-xs text-muted-foreground truncate">{email}</p>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-full justify-start text-destructive"
        onClick={onLogout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  async function handleLogout() {
    setMobileMenuOpen(false);
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

  if (!isAuthenticated || !user) {
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
      <aside className="hidden md:flex w-72 flex-col border-r border-border bg-card/50 shrink-0">
        <div className="px-4 py-5 shrink-0">
          <AppLogo background="light" height={54} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <SidebarNav />
        </div>
        <div className="p-4">
          <SidebarFooter
            name={user.name}
            email={user.email}
            onLogout={() => void handleLogout()}
          />
        </div>
      </aside>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(85vw,20rem)] flex-col border-r border-border bg-card shadow-xl md:hidden">
            <div className="flex items-center justify-between px-4 py-4 shrink-0 border-b border-border">
              <AppLogo background="light" href={null} height={48} />
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <SidebarNav onNavigate={() => setMobileMenuOpen(false)} />
            </div>
            <div className="p-4 shrink-0">
              <SidebarFooter
                name={user.name}
                email={user.email}
                onLogout={() => void handleLogout()}
              />
            </div>
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-2 border-b h-14 px-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            aria-label="Abrir menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="md:hidden min-w-0 flex-1">
            <AppLogo background="light" href={null} height={44} className="max-h-11 w-auto max-w-full" />
          </div>
          <div className="hidden md:block flex-1" />
          <NotificationBell />
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => void handleLogout()}>
            Sair
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <BackButton fallback="/dashboard" className="mb-4" />
          {children}
        </main>
      </div>
    </div>
  );
}
