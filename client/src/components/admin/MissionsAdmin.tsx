import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const empty = {
  title: "",
  description: "",
  category: "growth" as const,
  difficulty: "easy" as const,
  reward: 50,
  brandId: "" as number | "",
  requiresProof: true,
  isActive: true,
};

export function MissionsAdmin() {
  const utils = trpc.useUtils();
  const { data: missions = [], isLoading } = trpc.missions.admin.list.useQuery();
  const { data: brands = [] } = trpc.brands.listPublished.useQuery();
  const { data: submissions = [] } = trpc.missions.admin.submissions.useQuery({ pendingOnly: true });
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);

  const save = trpc.missions.admin.save.useMutation({
    onSuccess: () => {
      toast.success("Missão salva");
      utils.missions.admin.list.invalidate();
      utils.missions.feed.invalidate();
      setForm(empty);
      setEditingId(null);
    },
    onError: e => toast.error(e.message),
  });

  const review = trpc.missions.admin.reviewSubmission.useMutation({
    onSuccess: () => {
      toast.success("Participação revisada");
      utils.missions.admin.submissions.invalidate();
      utils.missions.feed.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  function startEdit(m: (typeof missions)[number]) {
    setEditingId(m.id);
    setForm({
      title: m.title,
      description: m.description ?? "",
      category: m.category,
      difficulty: m.difficulty,
      reward: m.reward,
      brandId: m.brandId ?? "",
      requiresProof: Boolean((m as { requiresProof?: boolean }).requiresProof),
      isActive: m.isActive,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" /> Missões
        </h2>
        <p className="text-sm text-muted-foreground">
          Gerais do clube ou específicas de uma marca. Participação enviada ≠ validada; pontos só na aprovação.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{editingId ? "Editar missão" : "Nova missão"}</h3>
          {editingId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingId(null);
                setForm(empty);
              }}
            >
              Cancelar
            </Button>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1 sm:col-span-2">
            <Label>Título</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label>Categoria</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as typeof form.category }))}
            >
              <option value="growth">Crescimento</option>
              <option value="engagement">Engajamento</option>
              <option value="learning">Aprendizado</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Dificuldade</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.difficulty}
              onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as typeof form.difficulty }))}
            >
              <option value="easy">Fácil</option>
              <option value="medium">Médio</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Pontos (só após validação)</Label>
            <Input
              type="number"
              min={0}
              value={form.reward}
              onChange={e => setForm(f => ({ ...f, reward: Number(e.target.value) || 0 }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Marca (opcional)</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.brandId}
              onChange={e => setForm(f => ({ ...f, brandId: e.target.value ? Number(e.target.value) : "" }))}
            >
              <option value="">Geral do clube</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.requiresProof}
            onChange={e => setForm(f => ({ ...f, requiresProof: e.target.checked }))}
          />
          Exigir link de participação antes da validação
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
          />
          Publicada
        </label>
        <Button
          className="btn-primary"
          disabled={save.isPending || form.title.trim().length < 3}
          onClick={() =>
            save.mutate({
              id: editingId ?? undefined,
              title: form.title,
              description: form.description || null,
              category: form.category,
              difficulty: form.difficulty,
              reward: form.reward,
              brandId: typeof form.brandId === "number" ? form.brandId : null,
              requiresProof: form.requiresProof,
              isActive: form.isActive,
            })
          }
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {editingId ? "Salvar alterações" : "Criar missão"}
        </Button>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : (
        <div className="space-y-2">
          {missions.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => startEdit(m)}
              className="w-full text-left rounded-xl border border-border p-3 hover:bg-muted/40"
            >
              <div className="flex justify-between gap-2">
                <p className="font-medium">{m.title}</p>
                <span className="text-xs text-muted-foreground">{m.isActive ? "Publicada" : "Inativa"}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {(m as { brandName?: string | null }).brandName ?? "Geral do clube"} · {m.reward} pts
              </p>
            </button>
          ))}
        </div>
      )}

      <Card className="p-4 space-y-3">
        <h3 className="font-medium">Participações aguardando validação</h3>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma no momento.</p>
        ) : (
          submissions.map(s => (
            <div key={s.id} className="rounded-lg border border-border p-3 space-y-2">
              <p className="font-medium text-sm">
                {s.missionTitle} · {s.userName || s.userUsername}
              </p>
              {s.submissionUrl && (
                <a href={s.submissionUrl} target="_blank" rel="noreferrer" className="text-xs text-accent break-all">
                  {s.submissionUrl}
                </a>
              )}
              {s.submissionNote && <p className="text-xs text-muted-foreground">{s.submissionNote}</p>}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="btn-primary"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ userMissionId: s.id, decision: "approved" })}
                >
                  Aprovar (+{s.missionReward} pts)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ userMissionId: s.id, decision: "rejected" })}
                >
                  Recusar
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
