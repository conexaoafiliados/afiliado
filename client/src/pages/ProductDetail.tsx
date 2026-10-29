import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { OFFER_CHANNEL_LABELS, isHttpUrl, type OfferChannel } from "@shared/brands";
import { ExternalLink, FileText, Loader2, Package } from "lucide-react";
import { useState } from "react";
import { Link, useRoute } from "wouter";

function TextBlock({ title, text }: { title: string; text: string | null }) {
  if (!text) return null;
  return (
    <section className="space-y-1">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground whitespace-pre-line">{text}</p>
    </section>
  );
}

export default function ProductDetail() {
  const [, params] = useRoute("/marcas/:slug/:productSlug");
  const brandSlug = params?.slug ?? "";
  const productSlug = params?.productSlug ?? "";
  const { data, isLoading, isError } = trpc.brands.getProduct.useQuery(
    { brandSlug, productSlug },
    { enabled: !!brandSlug && !!productSlug, retry: false }
  );
  const [selected, setSelected] = useState(0);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-10 text-center space-y-3 max-w-xl mx-auto">
        <p className="font-medium">Produto não encontrado</p>
        <Link href={brandSlug ? `/marcas/${brandSlug}` : "/marcas"}>
          <a className="text-accent hover:underline text-sm">Voltar</a>
        </Link>
      </Card>
    );
  }

  const { brand, product } = data;
  const images = product.imageUrls;
  const materials = product.referenceMaterials.filter(m => isHttpUrl(m.url));
  const offers = product.offers.filter(o => isHttpUrl(o.url));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href={`/marcas/${brand.slug}`}>
        <a className="text-sm text-muted-foreground hover:text-foreground">← {brand.name}</a>
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-muted flex items-center justify-center">
            {images[selected] ? (
              <img src={images[selected]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-10 w-10 text-muted-foreground/50" />
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSelected(i)}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-lg border",
                    i === selected ? "border-accent ring-2 ring-accent/30" : "border-border"
                  )}
                  aria-label={`Ver imagem ${i + 1}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            {product.category && <p className="text-xs text-muted-foreground">{product.category}</p>}
            <h1 className="text-2xl sm:text-3xl font-bold">{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              por{" "}
              <Link href={`/marcas/${brand.slug}`}>
                <a className="hover:underline" style={{ color: brand.accentColor ?? undefined }}>
                  {brand.name}
                </a>
              </Link>
            </p>
          </div>
          {product.description && <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>}

          <Card className="p-4 space-y-2">
            <h2 className="text-base font-semibold">Onde comprar</h2>
            {offers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não há links oficiais de compra cadastrados para este produto.
              </p>
            ) : (
              <>
                <ul className="space-y-2">
                  {offers.map(offer => (
                    <li key={offer.id}>
                      <a
                        href={offer.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50"
                      >
                        <span className="min-w-0">
                          <span className="block font-medium truncate">
                            {offer.label || OFFER_CHANNEL_LABELS[offer.channel as OfferChannel] || "Canal oficial"}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {OFFER_CHANNEL_LABELS[offer.channel as OfferChannel] ?? offer.channel}
                            {offer.notes ? ` · ${offer.notes}` : ""}
                          </span>
                        </span>
                        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  A compra acontece no canal indicado. Preço, estoque e entrega são definidos por cada canal.
                </p>
              </>
            )}
          </Card>
        </div>
      </div>

      <TextBlock title="Orientações de uso" text={product.usageGuidelines} />
      <TextBlock title="Informações aprovadas" text={product.approvedInfo} />

      {materials.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Materiais de referência</h2>
          <ul className="space-y-1">
            {materials.map(m => (
              <li key={m.url}>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  {m.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
