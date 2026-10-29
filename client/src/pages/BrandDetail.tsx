import { Card } from "@/components/ui/card";
import { readableTextColor } from "@shared/brands";
import { trpc } from "@/lib/trpc";
import { Loader2, Megaphone, Package } from "lucide-react";
import { Link, useRoute } from "wouter";

function softTint(hex: string | null | undefined, alpha = 0.14): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return "var(--muted)";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function BrandDetail() {
  const [, params] = useRoute("/marcas/:slug");
  const slug = params?.slug ?? "";
  const { data, isLoading, isError } = trpc.brands.getBySlug.useQuery({ slug }, { enabled: !!slug, retry: false });

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
        <p className="font-medium">Marca não encontrada</p>
        <p className="text-sm text-muted-foreground">Ela pode não existir ou ainda não ter sido publicada.</p>
        <Link href="/marcas">
          <a className="text-accent hover:underline text-sm">Ver todas as marcas</a>
        </Link>
      </Card>
    );
  }

  const { brand, products } = data;
  const accent = brand.accentColor ?? "var(--accent)";

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Link href="/marcas">
        <a className="text-sm text-muted-foreground hover:text-foreground">← Marcas e produtos</a>
      </Link>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="h-1.5 w-full" style={{ backgroundColor: accent }} aria-hidden />
        <div
          className="relative flex min-h-[140px] sm:min-h-[180px] items-center justify-center px-6 py-8"
          style={{
            background: brand.coverUrl
              ? undefined
              : `linear-gradient(165deg, ${softTint(brand.accentColor, 0.22)} 0%, ${softTint(brand.accentColor, 0.06)} 100%)`,
          }}
        >
          {brand.coverUrl && (
            <img src={brand.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
          )}
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={`Logo ${brand.name}`}
              className="relative z-[1] max-h-20 sm:max-h-28 w-auto max-w-[min(100%,320px)] object-contain drop-shadow-sm"
            />
          ) : (
            <div
              className="relative z-[1] flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold shadow-sm"
              style={{ backgroundColor: accent, color: readableTextColor(brand.accentColor) }}
            >
              {brand.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="px-5 sm:px-6 pb-6 pt-5 border-t border-border/60 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{brand.name}</h1>
          {brand.communicationConcept && (
            <p className="text-lg font-semibold" style={{ color: accent }}>
              {brand.communicationConcept}
            </p>
          )}
          {brand.description && (
            <p className="pt-1 text-muted-foreground whitespace-pre-line max-w-3xl leading-relaxed">{brand.description}</p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" /> Produtos
        </h2>
        {products.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">Nenhum produto publicado para esta marca ainda.</Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <Link key={product.id} href={`/marcas/${brand.slug}/${product.slug}`}>
                <a className="block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                  <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                    {product.imageUrls[0] ? (
                      <img src={product.imageUrls[0]} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="p-4">
                    {product.category && <p className="text-xs text-muted-foreground">{product.category}</p>}
                    <h3 className="font-semibold">{product.name}</h3>
                    {product.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    )}
                  </div>
                </a>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Megaphone className="h-5 w-5" /> Campanhas
        </h2>
        <Card className="p-6 text-sm text-muted-foreground">
          Nenhuma campanha aberta para {brand.name} no momento. Quando houver, os critérios, prazos e condições
          aparecerão aqui.
        </Card>
      </section>
    </div>
  );
}
