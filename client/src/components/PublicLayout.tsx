import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

/** Casca simples para páginas públicas de marcas (visitantes sem login). */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <AppLogo background="light" height={44} />
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
            <Link href="/cadastro">
              <Button size="sm" className="bg-accent text-accent-foreground">
                Criar conta
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="container py-6 md:py-8 max-w-5xl">{children}</main>
    </div>
  );
}
