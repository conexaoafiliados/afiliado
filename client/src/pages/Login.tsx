import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/const";
import { applyAuthSession } from "@/lib/authSession";
import { getSupabaseConfigError, supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { AppLogo } from "@/components/AppLogo";
import { BackButton } from "@/components/BackButton";

export default function Login() {
  const [, setLocation] = useLocation();
  const login = trpc.auth.login.useMutation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const configError = getSupabaseConfigError();

  if (!supabase || configError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3 text-muted-foreground">
          <p className="font-medium text-foreground">Configuração do Supabase incompleta</p>
          <p className="text-sm">{configError}</p>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const session = await login.mutateAsync({ username, password });
      await applyAuthSession(session.accessToken, session.refreshToken);
      setLocation("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Usuário ou senha incorretos");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-md mx-auto pt-2">
        <BackButton fallback="/" />
      </div>
      <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <AppLogo background="light" height={52} href={null} />
          </div>
          <p className="text-sm text-muted-foreground">Entre com usuário e senha</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              required
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="seu_usuario"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full btn-primary" disabled={login.isPending}>
            {login.isPending ? "Entrando…" : "Entrar"}
          </Button>
        </form>
        <p className="text-center text-sm space-y-2">
          <span>
            Não tem conta?{" "}
            <Link href="/cadastro" className="text-accent hover:underline">Cadastre-se</Link>
          </span>
          <br />
          <span className="text-muted-foreground">
            <Link href="/termos" className="hover:underline">Termos</Link>
            {" · "}
            <Link href="/privacidade" className="hover:underline">Privacidade</Link>
          </span>
        </p>
      </div>
      </div>
    </div>
  );
}
