import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/const";
import { getSupabaseConfigError, supabase } from "@/lib/supabase";
import { Link, useLocation } from "wouter";
import { Zap } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const configError = getSupabaseConfigError();

  if (!supabase || configError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3 text-muted-foreground">
          <p className="font-medium text-foreground">Configuração do Supabase incompleta</p>
          <p className="text-sm">{configError}</p>
          <p className="text-xs">Depois de editar o .env, pare o terminal (Ctrl+C) e rode <code>npm run dev</code> de novo.</p>
        </div>
      </div>
    );
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const redirectTo = `${window.location.origin}/dashboard`;
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (err) {
      const msg = err.message === "Failed to fetch"
        ? "Não foi possível conectar ao Supabase. Confira o .env (URL e anon key reais) e as URLs em Authentication → URL Configuration."
        : err.message;
      setError(msg);
    } else {
      setMessage("Enviamos um link de acesso para seu e-mail. Verifique a caixa de entrada e o spam.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground">Entre com seu e-mail para acessar o painel</p>
        </div>
        <form onSubmit={sendMagicLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}
          <Button type="submit" className="w-full btn-primary" disabled={loading}>
            {loading ? "Enviando…" : "Receber link de acesso"}
          </Button>
        </form>
        <p className="text-center text-sm">
          <Link href="/" className="text-accent hover:underline">
            Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}
