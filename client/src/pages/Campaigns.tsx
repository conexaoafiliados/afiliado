import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CAMPAIGN_STATUS_LABELS, type CampaignStatus } from "@shared/campaigns";
import { Loader2, Megaphone } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function Campaigns() {
  const { data: brands = [] } = trpc.brands.listPublished.useQuery();
  const [brandId, setBrandId] = useState<number | "">("");
  const [productId, setProductId] = useState<number | "">("");
  const [showClosed, setShowClosed] = useState(false);

  const selectedBrand = brands.find(b => b.id === brandId);
  const { data: brandDetail } = trpc.brands.getBySlug.useQuery(
    { slug: selectedBrand?.slug ?? "" },
    { enabled: Boolean(selectedBrand?.slug) }
  );

  const { data: campaigns = [], isLoading } = trpc.campaigns.listVisible.useQuery({
    brandId: typeof brandId === "number" ? brandId : undefined,
    brandProductId: typeof productId === "number" ? productId : undefined,
    includeClosed: showClosed,
  });

  const filtered = useMemo(() => {
    if (showClosed) return campaigns;
    return campaigns.filter(c => c.status === "published");
  }, [campaigns, showClosed]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Megaphone className="h-7 w-7 text-accent" /> Campanhas
        </h1>
        <p className="text-muted-foreground mt-1">
          Oportunidades publicadas pelas marcas. Leia briefing, critérios e condições antes de se candidatar.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Marca</span>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={brandId}
              onChange={e => {
                setBrandId(e.target.value ? Number(e.target.value) : "");
                setProductId("");
              }}
            >
              <option value="">Todas</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Produto</span>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={productId}
              disabled={!selectedBrand}
              onChange={e => setProductId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Todos</option>
              {(brandDetail?.products ?? []).map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)} />
          Incluir campanhas encerradas
        </label>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <p className="font-medium">Nenhuma campanha aberta no momento</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Quando a equipe publicar campanhas, elas aparecerão aqui com critérios, prazos e condições reais. Enquanto
            isso, conheça as marcas e acompanhe os avisos.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Link href="/marcas">
              <a>
                <Button className="btn-primary" size="sm">
                  Conhecer marcas e produtos
                </Button>
              </a>
            </Link>
            <Link href="/acessos/avisos">
              <a>
                <Button variant="outline" size="sm">
                  Ver avisos
                </Button>
              </a>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Link key={c.id} href={`/campanhas/${c.slug}`}>
              <a className="block rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold">{c.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.brandName}
                      {c.productNames.length ? ` · ${c.productNames.join(", ")}` : ""}
                    </p>
                  </div>
                  <span className="text-xs rounded-full px-2 py-0.5 bg-muted">
                    {c.acceptingApplications
                      ? "Aceitando candidaturas"
                      : CAMPAIGN_STATUS_LABELS[c.status as CampaignStatus]}
                  </span>
                </div>
                {c.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  Candidaturas: {formatDate(c.applicationOpensAt)} → {formatDate(c.applicationClosesAt)} · Entrega até{" "}
                  {formatDate(c.deliveryDeadline)}
                </p>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
