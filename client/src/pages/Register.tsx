import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_NAME } from "@/const";
import { useCep } from "@/hooks/useCep";
import { applyAuthSession } from "@/lib/authSession";
import { getSupabaseConfigError, supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Loader2, User, Zap } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [, setLocation] = useLocation();
  const { fetchCep, loading: cepLoading, error: cepError } = useCep();
  const register = trpc.auth.register.useMutation();

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    cep: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    age: "",
    tiktokHandle: "",
    instagramHandle: "",
    currentFollowers: "",
    platformObjective: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string | undefined>();
  const [error, setError] = useState("");

  const configError = getSupabaseConfigError();
  if (!supabase || configError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground text-center max-w-md">{configError}</p>
      </div>
    );
  }

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function onCepBlur() {
    const data = await fetchCep(form.cep);
    if (data) {
      setForm(prev => ({
        ...prev,
        street: data.street || prev.street,
        neighborhood: data.neighborhood || prev.neighborhood,
        city: data.city || prev.city,
        state: data.state || prev.state,
      }));
    }
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Foto deve ter no máximo 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result);
      setPhotoMime(file.type);
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    try {
      const session = await register.mutateAsync({
        username: form.username,
        password: form.password,
        name: form.name,
        cep: form.cep,
        street: form.street,
        number: form.number || undefined,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state || undefined,
        age: parseInt(form.age, 10),
        tiktokHandle: form.tiktokHandle,
        instagramHandle: form.instagramHandle,
        currentFollowers: parseInt(form.currentFollowers || "0", 10),
        platformObjective: form.platformObjective,
        profileImageBase64: photoBase64 ?? undefined,
        profileImageMime: photoMime,
      });
      await applyAuthSession(session.accessToken, session.refreshToken);
      toast.success("Conta criada com sucesso!");
      setLocation("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao cadastrar";
      setError(msg);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 md:p-8 shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Cadastro — {APP_NAME}</h1>
          <p className="text-sm text-muted-foreground">Crie sua conta com usuário e senha</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Foto */}
          <div className="flex flex-col items-center gap-3">
            <div className="h-24 w-24 rounded-full border-2 border-dashed border-accent/40 flex items-center justify-center overflow-hidden bg-muted">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <Label htmlFor="photo" className="cursor-pointer text-sm text-accent hover:underline">
              Escolher foto de perfil
            </Label>
            <Input id="photo" type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
          </div>

          {/* Acesso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário *</Label>
              <Input id="username" required value={form.username} onChange={e => update("username", e.target.value)} placeholder="seu_usuario" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input id="name" required value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input id="password" type="password" required minLength={6} value={form.password} onChange={e => update("password", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha *</Label>
              <Input id="confirm" type="password" required value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)} />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Endereço</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
                <Input id="cep" required value={form.cep} onChange={e => update("cep", e.target.value)} onBlur={onCepBlur} placeholder="00000-000" />
                {cepLoading && <p className="text-xs text-muted-foreground">Buscando CEP…</p>}
                {cepError && <p className="text-xs text-destructive">{cepError}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street">Endereço *</Label>
                <Input id="street" required value={form.street} onChange={e => update("street", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input id="number" value={form.number} onChange={e => update("number", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input id="neighborhood" required value={form.neighborhood} onChange={e => update("neighborhood", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input id="city" required value={form.city} onChange={e => update("city", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Creator */}
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Seu perfil creator</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Idade *</Label>
                <Input id="age" type="number" required min={13} max={120} value={form.age} onChange={e => update("age", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="followers">Seguidores atuais *</Label>
                <Input id="followers" type="number" required min={0} value={form.currentFollowers} onChange={e => update("currentFollowers", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktok">@ TikTok *</Label>
                <Input id="tiktok" required value={form.tiktokHandle} onChange={e => update("tiktokHandle", e.target.value)} placeholder="@seuuser" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">@ Instagram *</Label>
                <Input id="instagram" required value={form.instagramHandle} onChange={e => update("instagramHandle", e.target.value)} placeholder="@seuuser" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="objective">Objetivo ao entrar na plataforma *</Label>
              <Textarea
                id="objective"
                required
                minLength={10}
                placeholder="Ex: Quero crescer no TikTok, aprender a criar conteúdo e monetizar meu perfil…"
                value={form.platformObjective}
                onChange={e => update("platformObjective", e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Sugestões: crescer até 2k, aprender conteúdo, monetizar, conectar com creators, vender produtos.</p>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full btn-primary" disabled={register.isPending}>
            {register.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Criando conta…</> : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm">
          Já tem conta?{" "}
          <Link href="/login" className="text-accent hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
