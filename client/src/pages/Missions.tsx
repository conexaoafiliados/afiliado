import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MissionCard } from "@/components/MissionCard";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function Missions() {
  const utils = trpc.useUtils();
  const { data: brands = [] } = trpc.brands.listPublished.useQuery();
  const [brandFilter, setBrandFilter] = useState<"all" | "general" | number>("all");
  const { data, isLoading } = trpc.missions.feed.useQuery(
    typeof brandFilter === "number" ? { brandId: brandFilter } : undefined
  );
  const accept = trpc.missions.accept.useMutation({
    onSuccess: () => {
      utils.missions.feed.invalidate();
      toast.success("Missão aceita!");
    },
  });
  const submitProof = trpc.missions.submitProof.useMutation({
    onSuccess: () => {
      utils.missions.feed.invalidate();
      setSubmitFor(null);
      setUrl("");
      setNote("");
      toast.success("Participação enviada para validação");
    },
    onError: e => toast.error(e.message),
  });

  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");
  const [submitFor, setSubmitFor] = useState<number | null>(null);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  const missions = useMemo(() => {
    let list = (data ?? []).map(m => ({
      id: m.id,
      title: m.title,
      description: m.description ?? "",
      category: m.category,
      difficulty: m.difficulty,
      reward: m.reward,
      status: m.status,
      brandName: "brandName" in m ? (m.brandName as string | null) : null,
      requiresProof: Boolean((m as { requiresProof?: boolean }).requiresProof),
      validationStatus: (m as { validationStatus?: string }).validationStatus ?? "none",
      reviewNote: (m as { reviewNote?: string | null }).reviewNote ?? null,
    }));
    if (brandFilter === "general") {
      list = list.filter(m => !m.brandName);
    }
    return list;
  }, [data, brandFilter]);

  const filtered = missions.filter(m => filter === "all" || m.status === filter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Missões</h1>
        <p className="text-muted-foreground">
          Gerais do movimento ou de uma marca. Enviar participação não libera pontos — a equipe valida.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={brandFilter === "all" ? "default" : "outline"}
          className={brandFilter === "all" ? "btn-primary" : ""}
          onClick={() => setBrandFilter("all")}
        >
          Todas as marcas
        </Button>
        <Button
          variant={brandFilter === "general" ? "default" : "outline"}
          className={brandFilter === "general" ? "btn-primary" : ""}
          onClick={() => setBrandFilter("general")}
        >
          Gerais do clube
        </Button>
        {brands.map(b => (
          <Button
            key={b.id}
            variant={brandFilter === b.id ? "default" : "outline"}
            className={brandFilter === b.id ? "btn-primary" : ""}
            onClick={() => setBrandFilter(b.id)}
          >
            {b.name}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "in_progress", "completed"] as const).map(status => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            onClick={() => setFilter(status)}
            className={filter === status ? "btn-primary" : ""}
          >
            {status === "all" && "Todas"}
            {status === "pending" && "Pendentes"}
            {status === "in_progress" && "Em progresso"}
            {status === "completed" && "Concluídas"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(mission => (
            <div key={mission.id} className="space-y-2">
              <MissionCard
                {...mission}
                brandLabel={mission.brandName ?? "Geral do clube"}
                validationStatus={mission.validationStatus}
                onAccept={id => accept.mutate({ missionId: id })}
                onContinue={id => setSubmitFor(id)}
              />
              {mission.reviewNote && mission.validationStatus === "rejected" && (
                <p className="text-xs text-orange-700 px-1">Ajuste pedido: {mission.reviewNote}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <Card className="card-elegant text-center py-12">
          {missions.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhuma missão publicada no momento. Quando a equipe publicar novas missões, elas aparecerão aqui.
            </p>
          ) : (
            <p className="text-muted-foreground">Nenhuma missão nesta categoria</p>
          )}
        </Card>
      )}

      {submitFor !== null && (
        <Card className="p-5 space-y-3 max-w-lg mx-auto">
          <h3 className="font-semibold">Enviar participação</h3>
          <p className="text-sm text-muted-foreground">
            Isso registra o envio. Pontos só são creditados depois da validação da equipe.
          </p>
          <div className="space-y-2">
            <Label>Link (opcional, obrigatório se a missão exigir prova)</Label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://" />
          </div>
          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} rows={3} />
          </div>
          <div className="flex gap-2">
            <Button
              className="btn-primary"
              disabled={submitProof.isPending}
              onClick={() =>
                submitProof.mutate({
                  missionId: submitFor,
                  submissionUrl: url || null,
                  submissionNote: note || null,
                })
              }
            >
              {submitProof.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar para validação
            </Button>
            <Button variant="outline" onClick={() => setSubmitFor(null)}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
