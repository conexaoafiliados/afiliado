import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { prepareImageForUpload } from "@/lib/prepareImage";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  APPLICATION_STATUS_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CONTENT_FORMAT_LABELS,
  CONTENT_FORMATS,
  DELIVERY_STATUS_LABELS,
  canTransitionCampaignStatus,
  getCampaignPublishIssues,
  type CampaignStatus,
  type ContentFormat,
} from "@shared/campaigns";
import { slugify } from "@shared/brands";
import { ArrowLeft, ImagePlus, Loader2, Megaphone, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type CampaignForm = {
  id?: number;
  brandId: number | "";
  slug: string;
  title: string;
  description: string;
  coverUrl: string;
  briefing: string;
  participationCriteria: string;
  expectedDeliverables: string;
  contentFormats: ContentFormat[];
  applicationOpensAt: string;
  applicationClosesAt: string;
  deliveryDeadline: string;
  sampleConditions: string;
  commissionConditions: string;
  compensationConditions: string;
  requiresSampleAddress: boolean;
  requiresRepostAuth: boolean;
  requiresAdUsageAuth: boolean;
  productIds: number[];
};

const emptyForm = (): CampaignForm => ({
  brandId: "",
  slug: "",
  title: "",
  description: "",
  coverUrl: "",
  briefing: "",
  participationCriteria: "",
  expectedDeliverables: "",
  contentFormats: [],
  applicationOpensAt: "",
  applicationClosesAt: "",
  deliveryDeadline: "",
  sampleConditions: "",
  commissionConditions: "",
  compensationConditions: "",
  requiresSampleAddress: false,
  requiresRepostAuth: false,
  requiresAdUsageAuth: false,
  productIds: [],
});

function toLocalInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        status === "published" && "bg-emerald-100 text-emerald-800",
        status === "draft" && "bg-amber-100 text-amber-800",
        status === "closed" && "bg-muted text-muted-foreground",
        status === "pending" && "bg-amber-100 text-amber-800",
        status === "approved" && "bg-emerald-100 text-emerald-800",
        status === "rejected" && "bg-red-100 text-red-800",
        status === "submitted" && "bg-sky-100 text-sky-800",
        status === "changes_requested" && "bg-orange-100 text-orange-800"
      )}
    >
      {CAMPAIGN_STATUS_LABELS[status as CampaignStatus] ||
        APPLICATION_STATUS_LABELS[status as keyof typeof APPLICATION_STATUS_LABELS] ||
        DELIVERY_STATUS_LABELS[status as keyof typeof DELIVERY_STATUS_LABELS] ||
        status}
    </span>
  );
}

function CoverField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = trpc.campaigns.admin.uploadCover.useMutation();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const prepared = await prepareImageForUpload(file, "banner");
      if (!prepared.ok) {
        toast.error(prepared.error);
        return;
      }
      const result = await upload.mutateAsync({
        base64: prepared.data.base64,
        mime: prepared.data.mime as "image/png" | "image/jpeg" | "image/webp",
      });
      onChange(result.url);
      toast.success("Capa enviada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>Capa</Label>
      <div className="flex items-start gap-3">
        <div className="h-20 w-36 overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="space-y-2 flex-1 min-w-0">
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Enviar
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>
                Remover
              </Button>
            )}
          </div>
          <Input value={value} onChange={e => onChange(e.target.value)} placeholder="ou cole uma URL https://…" className="text-xs" />
        </div>
      </div>
    </div>
  );
}

function ApplicationsPanel({ campaignId }: { campaignId: number }) {
  const utils = trpc.useUtils();
  const { data = [], isLoading } = trpc.campaigns.admin.listApplications.useQuery({ campaignId });
  const reviewApp = trpc.campaigns.admin.reviewApplication.useMutation({
    onSuccess: () => {
      toast.success("Candidatura atualizada");
      utils.campaigns.admin.listApplications.invalidate({ campaignId });
      utils.campaigns.admin.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });
  const reviewDelivery = trpc.campaigns.admin.reviewDelivery.useMutation({
    onSuccess: () => {
      toast.success("Entrega atualizada");
      utils.campaigns.admin.listApplications.invalidate({ campaignId });
    },
    onError: e => toast.error(e.message),
  });
  const [notes, setNotes] = useState<Record<number, string>>({});

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!data.length) {
    return <p className="text-sm text-muted-foreground">Nenhuma candidatura ainda.</p>;
  }

  return (
    <div className="space-y-4">
      {data.map(app => {
        const latest = app.deliveries[0];
        return (
          <Card key={app.id} className="p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{app.userName || app.userUsername || `Usuário #${app.userId}`}</p>
                <p className="text-xs text-muted-foreground">{app.userEmail}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
            {app.message && <p className="text-sm whitespace-pre-wrap">{app.message}</p>}
            {(app.allowRepost || app.allowAdUsage) && (
              <p className="text-xs text-muted-foreground">
                Autorizações: {[app.allowRepost && "repost", app.allowAdUsage && "anúncios"].filter(Boolean).join(", ")}
              </p>
            )}
            {app.sampleAddress && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
                <p className="font-medium">Endereço para amostra (acesso restrito)</p>
                <p>
                  {app.sampleAddress.fullName} · {app.sampleAddress.phone}
                </p>
                <p>
                  {app.sampleAddress.street}, {app.sampleAddress.number}
                  {app.sampleAddress.complement ? ` — ${app.sampleAddress.complement}` : ""}
                </p>
                <p>
                  {app.sampleAddress.neighborhood} · {app.sampleAddress.city}/{app.sampleAddress.state} · CEP{" "}
                  {app.sampleAddress.zip}
                </p>
              </div>
            )}
            {app.status === "pending" && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Nota da revisão (opcional)"
                  value={notes[app.id] ?? ""}
                  onChange={e => setNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                  rows={2}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="btn-primary"
                    disabled={reviewApp.isPending}
                    onClick={() =>
                      reviewApp.mutate({
                        applicationId: app.id,
                        status: "approved",
                        reviewNote: notes[app.id] || null,
                      })
                    }
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewApp.isPending}
                    onClick={() =>
                      reviewApp.mutate({
                        applicationId: app.id,
                        status: "rejected",
                        reviewNote: notes[app.id] || null,
                      })
                    }
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            )}
            {app.reviewNote && app.status !== "pending" && (
              <p className="text-xs text-muted-foreground">Nota: {app.reviewNote}</p>
            )}

            {app.deliveries.length > 0 && (
              <div className="border-t border-border pt-3 space-y-3">
                <p className="text-sm font-medium">Entregas</p>
                {app.deliveries.map(d => (
                  <div key={d.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <a href={d.contentUrl} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline break-all">
                        {d.contentUrl}
                      </a>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">Tentativa {d.attempt}</p>
                    {d.note && <p className="text-sm">{d.note}</p>}
                    {d.revisionNote && <p className="text-xs text-orange-700">Ajuste pedido: {d.revisionNote}</p>}
                    {d.status === "submitted" && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Pedido de ajuste (obrigatório se solicitar ajustes)"
                          value={notes[-d.id] ?? ""}
                          onChange={e => setNotes(prev => ({ ...prev, [-d.id]: e.target.value }))}
                          rows={2}
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="btn-primary"
                            disabled={reviewDelivery.isPending}
                            onClick={() =>
                              reviewDelivery.mutate({
                                deliveryId: d.id,
                                status: "approved",
                                revisionNote: notes[-d.id] || null,
                              })
                            }
                          >
                            Aprovar entrega
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={reviewDelivery.isPending}
                            onClick={() =>
                              reviewDelivery.mutate({
                                deliveryId: d.id,
                                status: "changes_requested",
                                revisionNote: notes[-d.id] || null,
                              })
                            }
                          >
                            Pedir ajustes
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {!latest && null}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function CampaignEditor({
  campaignId,
  onBack,
  onCreated,
}: {
  campaignId: number | "new";
  onBack: () => void;
  onCreated: (id: number) => void;
}) {
  const utils = trpc.useUtils();
  const isNew = campaignId === "new";
  const { data, isLoading } = trpc.campaigns.admin.get.useQuery(
    { id: typeof campaignId === "number" ? campaignId : 0 },
    { enabled: typeof campaignId === "number" }
  );
  const { data: brandOptions = [] } = trpc.campaigns.admin.brandOptions.useQuery();
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [tab, setTab] = useState<"edit" | "applications">("edit");

  useEffect(() => {
    if (!data?.campaign) return;
    const c = data.campaign;
    setForm({
      id: c.id,
      brandId: c.brandId,
      slug: c.slug,
      title: c.title,
      description: c.description ?? "",
      coverUrl: c.coverUrl ?? "",
      briefing: c.briefing ?? "",
      participationCriteria: c.participationCriteria ?? "",
      expectedDeliverables: c.expectedDeliverables ?? "",
      contentFormats: (c.contentFormats ?? []).filter((f): f is ContentFormat =>
        (CONTENT_FORMATS as readonly string[]).includes(f)
      ),
      applicationOpensAt: toLocalInput(c.applicationOpensAt),
      applicationClosesAt: toLocalInput(c.applicationClosesAt),
      deliveryDeadline: toLocalInput(c.deliveryDeadline),
      sampleConditions: c.sampleConditions ?? "",
      commissionConditions: c.commissionConditions ?? "",
      compensationConditions: c.compensationConditions ?? "",
      requiresSampleAddress: c.requiresSampleAddress,
      requiresRepostAuth: c.requiresRepostAuth,
      requiresAdUsageAuth: c.requiresAdUsageAuth,
      productIds: data.productIds,
    });
    setSlugTouched(true);
  }, [data]);

  const selectableProducts =
    brandOptions.find(b => b.id === form.brandId)?.products ?? data?.brandProducts ?? [];

  const publishIssues = useMemo(
    () =>
      getCampaignPublishIssues({
        title: form.title,
        briefing: form.briefing,
        brandId: typeof form.brandId === "number" ? form.brandId : null,
        productIds: form.productIds,
        applicationOpensAt: form.applicationOpensAt || null,
        applicationClosesAt: form.applicationClosesAt || null,
        deliveryDeadline: form.deliveryDeadline || null,
      }),
    [form]
  );

  const save = trpc.campaigns.admin.save.useMutation({
    onSuccess: row => {
      toast.success("Campanha salva");
      utils.campaigns.admin.list.invalidate();
      if (isNew) onCreated(row.id);
      else utils.campaigns.admin.get.invalidate({ id: row.id });
    },
    onError: e => toast.error(e.message),
  });

  const setStatus = trpc.campaigns.admin.setStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado");
      utils.campaigns.admin.list.invalidate();
      if (typeof campaignId === "number") utils.campaigns.admin.get.invalidate({ id: campaignId });
    },
    onError: e => toast.error(e.message),
  });

  function update<K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function onSave() {
    if (typeof form.brandId !== "number") {
      toast.error("Selecione uma marca");
      return;
    }
    save.mutate({
      id: form.id,
      brandId: form.brandId,
      slug: form.slug,
      title: form.title,
      description: form.description || null,
      coverUrl: form.coverUrl || null,
      briefing: form.briefing || null,
      participationCriteria: form.participationCriteria || null,
      expectedDeliverables: form.expectedDeliverables || null,
      contentFormats: form.contentFormats,
      applicationOpensAt: form.applicationOpensAt || null,
      applicationClosesAt: form.applicationClosesAt || null,
      deliveryDeadline: form.deliveryDeadline || null,
      sampleConditions: form.sampleConditions || null,
      commissionConditions: form.commissionConditions || null,
      compensationConditions: form.compensationConditions || null,
      requiresSampleAddress: form.requiresSampleAddress,
      requiresRepostAuth: form.requiresRepostAuth,
      requiresAdUsageAuth: form.requiresAdUsageAuth,
      productIds: form.productIds,
    });
  }

  if (!isNew && isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const status = (data?.campaign.status ?? "draft") as CampaignStatus;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        {!isNew && (
          <>
            <StatusBadge status={status} />
            <div className="flex flex-wrap gap-2 ml-auto">
              {canTransitionCampaignStatus(status, "published") && (
                <Button
                  size="sm"
                  className="btn-primary"
                  disabled={setStatus.isPending || publishIssues.length > 0}
                  title={publishIssues.join(" ") || undefined}
                  onClick={() => setStatus.mutate({ id: data!.campaign.id, status: "published" })}
                >
                  Publicar
                </Button>
              )}
              {canTransitionCampaignStatus(status, "draft") && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={setStatus.isPending}
                  onClick={() => setStatus.mutate({ id: data!.campaign.id, status: "draft" })}
                >
                  Voltar a rascunho
                </Button>
              )}
              {canTransitionCampaignStatus(status, "closed") && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={setStatus.isPending}
                  onClick={() => {
                    if (confirm("Encerrar a campanha? Novas candidaturas serão bloqueadas.")) {
                      setStatus.mutate({ id: data!.campaign.id, status: "closed" });
                    }
                  }}
                >
                  Encerrar
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {!isNew && (
        <div className="flex gap-2 border-b border-border">
          <button
            type="button"
            className={cn("px-3 py-2 text-sm", tab === "edit" ? "border-b-2 border-accent font-medium" : "text-muted-foreground")}
            onClick={() => setTab("edit")}
          >
            Dados
          </button>
          <button
            type="button"
            className={cn(
              "px-3 py-2 text-sm",
              tab === "applications" ? "border-b-2 border-accent font-medium" : "text-muted-foreground"
            )}
            onClick={() => setTab("applications")}
          >
            Candidaturas
          </button>
        </div>
      )}

      {tab === "applications" && typeof campaignId === "number" ? (
        <ApplicationsPanel campaignId={campaignId} />
      ) : (
        <Card className="p-4 sm:p-6 space-y-4">
          {publishIssues.length > 0 && status !== "published" && (
            <p className="text-xs text-muted-foreground">Para publicar: {publishIssues.join(" ")}</p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={e => {
                  const title = e.target.value;
                  update("title", title);
                  if (!slugTouched) update("slug", slugify(title));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Identificador de URL</Label>
              <Input
                value={form.slug}
                onChange={e => {
                  setSlugTouched(true);
                  update("slug", slugify(e.target.value));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Marca</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.brandId}
                disabled={!isNew && status !== "draft"}
                onChange={e => {
                  const brandId = e.target.value ? Number(e.target.value) : "";
                  update("brandId", brandId);
                  update("productIds", []);
                }}
              >
                <option value="">Selecione…</option>
                {brandOptions.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.status !== "published" ? ` (${b.status})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Produtos da mesma marca</Label>
            <div className="flex flex-wrap gap-2">
              {selectableProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Selecione uma marca com produtos.</p>
              ) : (
                selectableProducts
                  .filter(p => p.status !== "archived")
                  .map(p => {
                    const checked = form.productIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm cursor-pointer",
                          checked ? "border-accent bg-accent/10" : "border-border"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() =>
                            update(
                              "productIds",
                              checked ? form.productIds.filter(id => id !== p.id) : [...form.productIds, p.id]
                            )
                          }
                        />
                        {p.name}
                      </label>
                    );
                  })
              )}
            </div>
          </div>

          <CoverField value={form.coverUrl} onChange={url => update("coverUrl", url)} />

          <div className="space-y-2">
            <Label>Descrição curta</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Briefing</Label>
            <Textarea value={form.briefing} onChange={e => update("briefing", e.target.value)} rows={6} />
          </div>
          <div className="space-y-2">
            <Label>Critérios de participação</Label>
            <Textarea
              value={form.participationCriteria}
              onChange={e => update("participationCriteria", e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Entregas esperadas</Label>
            <Textarea
              value={form.expectedDeliverables}
              onChange={e => update("expectedDeliverables", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Formatos</Label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_FORMATS.map(f => {
                const checked = form.contentFormats.includes(f);
                return (
                  <label
                    key={f}
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-sm cursor-pointer",
                      checked ? "border-accent bg-accent/10" : "border-border"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() =>
                        update(
                          "contentFormats",
                          checked ? form.contentFormats.filter(x => x !== f) : [...form.contentFormats, f]
                        )
                      }
                    />
                    {CONTENT_FORMAT_LABELS[f]}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Início das candidaturas</Label>
              <Input
                type="datetime-local"
                value={form.applicationOpensAt}
                onChange={e => update("applicationOpensAt", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fim das candidaturas</Label>
              <Input
                type="datetime-local"
                value={form.applicationClosesAt}
                onChange={e => update("applicationClosesAt", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Prazo de entrega</Label>
              <Input
                type="datetime-local"
                value={form.deliveryDeadline}
                onChange={e => update("deliveryDeadline", e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Condições de amostra</Label>
              <Textarea value={form.sampleConditions} onChange={e => update("sampleConditions", e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Comissão</Label>
              <Textarea
                value={form.commissionConditions}
                onChange={e => update("commissionConditions", e.target.value)}
                rows={3}
                placeholder="Deixe em branco se não houver comissão nesta campanha"
              />
            </div>
            <div className="space-y-2">
              <Label>Remuneração</Label>
              <Textarea
                value={form.compensationConditions}
                onChange={e => update("compensationConditions", e.target.value)}
                rows={3}
                placeholder="Deixe em branco se não houver pagamento nesta campanha"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.requiresSampleAddress}
                onChange={e => update("requiresSampleAddress", e.target.checked)}
              />
              Exigir endereço para envio de amostra
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.requiresRepostAuth}
                onChange={e => update("requiresRepostAuth", e.target.checked)}
              />
              Exigir autorização explícita de repost
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.requiresAdUsageAuth}
                onChange={e => update("requiresAdUsageAuth", e.target.checked)}
              />
              Exigir autorização explícita de uso em anúncios
            </label>
          </div>

          <div className="flex justify-end">
            <Button className="btn-primary" disabled={save.isPending} onClick={onSave}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export function CampaignsAdmin() {
  const { data = [], isLoading } = trpc.campaigns.admin.list.useQuery();
  const [selected, setSelected] = useState<number | "new" | null>(null);

  if (selected !== null) {
    return (
      <CampaignEditor
        campaignId={selected}
        onBack={() => setSelected(null)}
        onCreated={id => setSelected(id)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5" /> Campanhas
          </h2>
          <p className="text-sm text-muted-foreground">
            Crie, publique e encerre. Rascunhos não aparecem para creators. Encerrar preserva o histórico.
          </p>
        </div>
        <Button className="btn-primary" size="sm" onClick={() => setSelected("new")}>
          <Plus className="h-4 w-4 mr-1" /> Nova campanha
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : data.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Nenhuma campanha cadastrada ainda.</Card>
      ) : (
        <div className="space-y-2">
          {data.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className="w-full text-left rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.brandName} · /{c.slug}
                    {c.productNames.length ? ` · ${c.productNames.join(", ")}` : ""}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Candidaturas: {c.applications.total} ({c.applications.pending} em análise, {c.applications.approved}{" "}
                aprovadas)
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
