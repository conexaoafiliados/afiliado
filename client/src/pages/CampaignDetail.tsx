import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  APPLICATION_STATUS_LABELS,
  CONTENT_FORMAT_LABELS,
  DELIVERY_STATUS_LABELS,
  type ApplicationStatus,
  type ContentFormat,
  type DeliveryStatus,
} from "@shared/campaigns";
import { ArrowLeft, Loader2, Megaphone } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const emptyAddress = {
  fullName: "",
  phone: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zip: "",
};

export default function CampaignDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const utils = trpc.useUtils();
  const { data: campaign, isLoading, error } = trpc.campaigns.getBySlug.useQuery(
    { slug },
    { enabled: Boolean(slug), retry: false }
  );
  const { data: mine, isLoading: loadingMine } = trpc.campaigns.myApplication.useQuery(
    { campaignId: campaign?.id ?? 0 },
    { enabled: Boolean(campaign?.id), retry: false }
  );

  const [message, setMessage] = useState("");
  const [allowRepost, setAllowRepost] = useState(false);
  const [allowAdUsage, setAllowAdUsage] = useState(false);
  const [address, setAddress] = useState(emptyAddress);
  const [contentUrl, setContentUrl] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");

  const apply = trpc.campaigns.submitApplication.useMutation({
    onSuccess: () => {
      toast.success("Candidatura enviada");
      utils.campaigns.myApplication.invalidate({ campaignId: campaign!.id });
      utils.movement.home.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const submitDelivery = trpc.campaigns.submitDelivery.useMutation({
    onSuccess: () => {
      toast.success("Entrega enviada");
      setContentUrl("");
      setDeliveryNote("");
      utils.campaigns.myApplication.invalidate({ campaignId: campaign!.id });
      utils.movement.home.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-8">
        <p className="font-medium">Campanha não encontrada</p>
        <Link href="/campanhas">
          <a className="text-accent text-sm hover:underline">Voltar às campanhas</a>
        </Link>
      </div>
    );
  }

  const latest = mine?.deliveries[0];
  const canDeliver =
    mine?.application.status === "approved" &&
    (!latest || latest.status === "changes_requested");

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link href="/campanhas">
          <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="h-4 w-4 mr-1" /> Campanhas
          </a>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Megaphone className="h-7 w-7 text-accent" /> {campaign.title}
        </h1>
        <p className="text-muted-foreground mt-1">
          <Link href={`/marcas/${campaign.brandSlug}`}>
            <a className="text-accent hover:underline">{campaign.brandName}</a>
          </Link>
          {campaign.productNames.length ? ` · ${campaign.productNames.join(", ")}` : ""}
        </p>
      </div>

      {campaign.coverUrl && (
        <div className="overflow-hidden rounded-2xl border border-border aspect-[2/1] bg-muted">
          <img src={campaign.coverUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <Card className="p-5 space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Candidaturas:</span> {formatDate(campaign.applicationOpensAt)} →{" "}
          {formatDate(campaign.applicationClosesAt)}
        </p>
        <p>
          <span className="text-muted-foreground">Prazo de entrega:</span> {formatDate(campaign.deliveryDeadline)}
        </p>
        <p>
          <span className="text-muted-foreground">Status:</span>{" "}
          {campaign.acceptingApplications ? "Aceitando candidaturas" : campaign.status === "closed" ? "Encerrada" : "Fora do período"}
        </p>
      </Card>

      {campaign.description && (
        <section className="space-y-2">
          <h2 className="font-semibold">Sobre</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaign.description}</p>
        </section>
      )}

      {campaign.briefing && (
        <section className="space-y-2">
          <h2 className="font-semibold">Briefing</h2>
          <p className="text-sm whitespace-pre-wrap">{campaign.briefing}</p>
        </section>
      )}

      {campaign.participationCriteria && (
        <section className="space-y-2">
          <h2 className="font-semibold">Critérios de participação</h2>
          <p className="text-sm whitespace-pre-wrap">{campaign.participationCriteria}</p>
        </section>
      )}

      {campaign.expectedDeliverables && (
        <section className="space-y-2">
          <h2 className="font-semibold">Entregas esperadas</h2>
          <p className="text-sm whitespace-pre-wrap">{campaign.expectedDeliverables}</p>
        </section>
      )}

      {campaign.contentFormats.length > 0 && (
        <p className="text-sm">
          <span className="text-muted-foreground">Formatos: </span>
          {campaign.contentFormats
            .map(f => CONTENT_FORMAT_LABELS[f as ContentFormat] ?? f)
            .join(", ")}
        </p>
      )}

      <section className="grid sm:grid-cols-3 gap-3">
        <Card className="p-4 space-y-1">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Amostra</p>
          <p className="text-sm whitespace-pre-wrap">
            {campaign.sampleConditions?.trim() || "Não informada nesta campanha."}
          </p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Comissão</p>
          <p className="text-sm whitespace-pre-wrap">
            {campaign.commissionConditions?.trim() || "Não há comissão nesta campanha."}
          </p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Remuneração</p>
          <p className="text-sm whitespace-pre-wrap">
            {campaign.compensationConditions?.trim() || "Não há remuneração nesta campanha."}
          </p>
        </Card>
      </section>

      {campaign.products.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Produtos</h2>
          <ul className="text-sm space-y-1">
            {campaign.products.map(p => (
              <li key={p.id}>
                <Link href={`/marcas/${campaign.brandSlug}/${p.slug}`}>
                  <a className="text-accent hover:underline">{p.name}</a>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Sua participação</h2>
        {loadingMine ? (
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        ) : mine ? (
          <div className="space-y-4">
            <p className="text-sm">
              Candidatura:{" "}
              <strong>{APPLICATION_STATUS_LABELS[mine.application.status as ApplicationStatus]}</strong>
            </p>
            {mine.application.reviewNote && (
              <p className="text-sm text-muted-foreground">Nota da equipe: {mine.application.reviewNote}</p>
            )}

            {mine.deliveries.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Entregas</p>
                {mine.deliveries.map(d => (
                  <div key={d.id} className="rounded-lg border border-border p-3 text-sm space-y-1">
                    <a href={d.contentUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline break-all">
                      {d.contentUrl}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {DELIVERY_STATUS_LABELS[d.status as DeliveryStatus]} · tentativa {d.attempt}
                    </p>
                    {d.revisionNote && <p className="text-orange-700">Ajuste pedido: {d.revisionNote}</p>}
                  </div>
                ))}
              </div>
            )}

            {canDeliver && (
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-medium">Enviar link do conteúdo</p>
                <div className="space-y-2">
                  <Label>URL do conteúdo</Label>
                  <Input
                    value={contentUrl}
                    onChange={e => setContentUrl(e.target.value)}
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observação (opcional)</Label>
                  <Textarea value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} rows={2} />
                </div>
                <Button
                  className="btn-primary"
                  disabled={submitDelivery.isPending || !contentUrl.trim()}
                  onClick={() =>
                    submitDelivery.mutate({
                      campaignId: campaign.id,
                      contentUrl: contentUrl.trim(),
                      note: deliveryNote || null,
                    })
                  }
                >
                  {submitDelivery.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Enviar entrega
                </Button>
              </div>
            )}
          </div>
        ) : campaign.acceptingApplications ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Mensagem (opcional)</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} />
            </div>

            {campaign.requiresSampleAddress && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-sm font-medium">Endereço para amostra</p>
                <p className="text-xs text-muted-foreground">
                  Visível apenas para a equipe responsável. Não aparece no perfil público.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(
                    [
                      ["fullName", "Nome completo"],
                      ["phone", "Telefone"],
                      ["street", "Rua"],
                      ["number", "Número"],
                      ["complement", "Complemento"],
                      ["neighborhood", "Bairro"],
                      ["city", "Cidade"],
                      ["state", "UF"],
                      ["zip", "CEP"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <Label>{label}</Label>
                      <Input
                        value={address[key]}
                        onChange={e => setAddress(prev => ({ ...prev, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {campaign.requiresRepostAuth && (
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={allowRepost} onChange={e => setAllowRepost(e.target.checked)} />
                Autorizo o repost deste conteúdo pela marca/equipe, se minha participação for aprovada.
              </label>
            )}
            {campaign.requiresAdUsageAuth && (
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={allowAdUsage}
                  onChange={e => setAllowAdUsage(e.target.checked)}
                />
                Autorizo o uso deste conteúdo em anúncios, se minha participação for aprovada.
              </label>
            )}

            <Button
              className="btn-primary"
              disabled={apply.isPending}
              onClick={() =>
                apply.mutate({
                  campaignId: campaign.id,
                  message: message || null,
                  sampleAddress: campaign.requiresSampleAddress ? address : null,
                  allowRepost,
                  allowAdUsage,
                })
              }
            >
              {apply.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar candidatura
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Esta campanha não está aceitando novas candidaturas no momento.
          </p>
        )}
      </Card>
    </div>
  );
}
