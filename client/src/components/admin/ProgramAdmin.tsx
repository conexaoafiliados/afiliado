import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import type { PointRules } from "@shared/affiliateProgram";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function toIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function ProgramAdmin() {
  const utils = trpc.useUtils();
  const challenges = trpc.affiliateProgram.admin.challenges.useQuery();
  const rules = trpc.affiliateProgram.admin.rules.useQuery();
  const products = trpc.affiliateProgram.admin.products.useQuery();
  const materials = trpc.affiliateProgram.admin.materials.useQuery();
  const brands = trpc.brands.listPublished.useQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [handle, setHandle] = useState("");
  const [brandId, setBrandId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [ruleDraft, setRuleDraft] = useState<PointRules | null>(null);
  const [materialTitle, setMaterialTitle] = useState("");
  const [file, setFile] = useState<{ base64: string; mime: string } | null>(null);

  const create = trpc.affiliateProgram.admin.createChallenge.useMutation({
    onSuccess: () => {
      utils.affiliateProgram.admin.challenges.invalidate();
      utils.affiliateProgram.challenges.invalidate();
      setTitle("");
      setDescription("");
      setHandle("");
      toast.success("Desafio publicado");
    },
    onError: error => toast.error(error.message),
  });
  const setStatus = trpc.affiliateProgram.admin.setChallengeStatus.useMutation({
    onSuccess: () => {
      utils.affiliateProgram.admin.challenges.invalidate();
      utils.affiliateProgram.challenges.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const saveRules = trpc.affiliateProgram.admin.saveRules.useMutation({
    onSuccess: () => {
      utils.affiliateProgram.admin.rules.invalidate();
      utils.affiliateProgram.points.invalidate();
      toast.success("Regulamento atualizado");
    },
    onError: error => toast.error(error.message),
  });
  const setPoints = trpc.affiliateProgram.admin.setProductPoints.useMutation({
    onSuccess: () => {
      utils.affiliateProgram.admin.products.invalidate();
      utils.affiliateProgram.points.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const upload = trpc.affiliateProgram.admin.uploadMaterial.useMutation({
    onSuccess: () => {
      utils.affiliateProgram.admin.materials.invalidate();
      utils.affiliateProgram.materials.invalidate();
      setMaterialTitle("");
      setFile(null);
      toast.success("Material disponível para download");
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.affiliateProgram.admin.deleteMaterial.useMutation({
    onSuccess: () => {
      utils.affiliateProgram.admin.materials.invalidate();
      utils.affiliateProgram.materials.invalidate();
    },
  });

  const loadedRules: PointRules | null = rules.data
    ? {
        storyPoints: rules.data.storyPoints,
        feedPoints: rules.data.feedPoints,
        reelPoints: rules.data.reelPoints,
        salePoints: rules.data.salePoints,
        redeemMinPoints: rules.data.redeemMinPoints,
        redeemMinSales: rules.data.redeemMinSales,
        redeemItemLimit: rules.data.redeemItemLimit,
        redeemDays: rules.data.redeemDays,
      }
    : null;
  const draft = ruleDraft ?? loadedRules;
  const migration = challenges.data?.message || rules.data?.message;

  return (
    <div className="space-y-6">
      {migration && (
        <Card className="p-4 text-sm">
          As tabelas do programa ainda não existem neste banco. {migration}
        </Card>
      )}

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Novo desafio</h2>
        <p className="text-sm text-muted-foreground">
          Fica em andamento até você encerrar. O @ informado entra no regulamento no lugar do nome da marca.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={event => setTitle(event.target.value)} />
          </div>
          <div>
            <Label>Instagram da marca</Label>
            <Input value={handle} placeholder="@marca" onChange={event => setHandle(event.target.value)} />
          </div>
          <div>
            <Label>Começa</Label>
            <Input type="datetime-local" value={startsAt} onChange={event => setStartsAt(event.target.value)} />
          </div>
          <div>
            <Label>Termina</Label>
            <Input type="datetime-local" value={endsAt} onChange={event => setEndsAt(event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Marca no portal (opcional)</Label>
            <select
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={brandId}
              onChange={event => setBrandId(event.target.value)}
            >
              <option value="">Sem marca vinculada</option>
              {(brands.data ?? []).map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={event => setDescription(event.target.value)} />
          </div>
        </div>
        <Button
          type="button"
          disabled={create.isPending}
          onClick={() =>
            create.mutate({
              title,
              description,
              instagramHandle: handle,
              brandId: brandId ? Number(brandId) : null,
              startsAt: toIso(startsAt),
              endsAt: toIso(endsAt),
            })
          }
        >
          Publicar desafio
        </Button>
        <ul className="divide-y divide-border">
          {(challenges.data?.challenges ?? []).map(item => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground">@{item.instagramHandle.replace(/^@/, "")} · {item.status === "active" ? "em andamento" : "encerrado"}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setStatus.mutate({ id: item.id, status: item.status === "active" ? "ended" : "active" })
                }
              >
                {item.status === "active" ? "Encerrar" : "Reabrir"}
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Pontos do regulamento</h2>
        <p className="text-sm text-muted-foreground">
          Os pontos dos desafios são trocados por produto. Estes números valem para stories, feed, reels e vendas.
        </p>
        {draft && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["storyPoints", "Stories"],
                ["feedPoints", "Feed"],
                ["reelPoints", "Reels"],
                ["salePoints", "Venda"],
                ["redeemMinPoints", "Pontos mínimos para trocar"],
                ["redeemMinSales", "Vendas mínimas para trocar"],
                ["redeemItemLimit", "Itens por troca"],
                ["redeemDays", "Dias para escolher"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  type="number"
                  value={draft[key]}
                  onChange={event =>
                    draft &&
                    setRuleDraft({ ...draft, [key]: Number(event.target.value) })
                  }
                />
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          disabled={!draft || saveRules.isPending}
          onClick={() =>
            draft &&
            saveRules.mutate({
              storyPoints: Number(draft.storyPoints),
              feedPoints: Number(draft.feedPoints),
              reelPoints: Number(draft.reelPoints),
              salePoints: Number(draft.salePoints),
              redeemMinPoints: Number(draft.redeemMinPoints),
              redeemMinSales: Number(draft.redeemMinSales),
              redeemItemLimit: Number(draft.redeemItemLimit),
              redeemDays: Number(draft.redeemDays),
            })
          }
        >
          Salvar regulamento
        </Button>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Pontos de cada produto</h2>
        <p className="text-sm text-muted-foreground">Zero tira o produto da troca. O valor é o que você digitar.</p>
        {products.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ul className="divide-y divide-border">
            {(products.data?.products ?? []).map(product => (
              <li key={product.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.brandName}</p>
                </div>
                <Input
                  className="w-24"
                  type="number"
                  min={0}
                  defaultValue={product.pointsCost ?? 0}
                  onBlur={event =>
                    setPoints.mutate({
                      brandProductId: product.id,
                      pointsCost: Math.max(0, Number(event.target.value) || 0),
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Materiais</h2>
        <p className="text-sm text-muted-foreground">PNG, JPG, WEBP, GIF, PDF ou MP4 até 8 MB. A afiliada baixa ao clicar.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Título</Label>
            <Input value={materialTitle} onChange={event => setMaterialTitle(event.target.value)} />
          </div>
          <div>
            <Label>Arquivo</Label>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,video/mp4"
              onChange={event => {
                const picked = event.target.files?.[0];
                if (!picked) return;
                if (picked.size > 8 * 1024 * 1024) {
                  toast.error("Arquivo maior que 8 MB");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  const raw = String(reader.result ?? "");
                  setFile({ base64: raw.split(",")[1] ?? "", mime: picked.type });
                  if (!materialTitle) setMaterialTitle(picked.name.replace(/\.[^.]+$/, ""));
                };
                reader.readAsDataURL(picked);
              }}
            />
          </div>
        </div>
        <Button
          type="button"
          disabled={!file || materialTitle.trim().length < 2 || upload.isPending}
          onClick={() => file && upload.mutate({ title: materialTitle, base64: file.base64, mime: file.mime as "image/png" })}
        >
          Publicar material
        </Button>
        <ul className="divide-y divide-border">
          {(materials.data?.materials ?? []).map(item => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>{item.title}</span>
              <button type="button" onClick={() => remove.mutate({ id: item.id })} aria-label="Remover">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
