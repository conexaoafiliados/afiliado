import { AppLogo } from "@/components/AppLogo";
import { BackButton } from "@/components/BackButton";
import { Link } from "wouter";
import type { ReactNode } from "react";

export function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="container max-w-3xl py-4 flex items-center justify-between gap-4">
          <BackButton fallback="/" />
          <AppLogo background="light" height={48} />
        </div>
      </header>
      <main className="container max-w-3xl py-10 pb-16">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: {updatedAt}</p>
        <article className="prose-legal space-y-6 text-foreground/90">{children}</article>
        <footer className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground flex flex-wrap gap-4">
          <Link href="/termos" className="hover:text-foreground hover:underline">
            Termos de Serviço
          </Link>
          <Link href="/privacidade" className="hover:text-foreground hover:underline">
            Política de Privacidade
          </Link>
          <Link href="/" className="hover:text-foreground hover:underline">
            Início
          </Link>
        </footer>
      </main>
    </div>
  );
}
