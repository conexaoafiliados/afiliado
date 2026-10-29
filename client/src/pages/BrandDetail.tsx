import { BrandAvatar } from "@/components/BrandCard";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Megaphone, Package } from "lucide-react";
import { Link, useRoute } from "wouter";

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
        <div className="relative h-36 sm:h-48 w-full overflow-hidden" style={{ backgroundColor: accent }}>
          {brand.coverUrl && <img src={brand.coverUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="px-5 pb-6 -mt-9 sm:-mt-10">
          <BrandAvatar brand={brand} size={80} />
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold">{brand.name}</h1>
          {brand.communicationConcept && (
            <p className="mt-1 text-lg font-semibold" style={{ color: brand.accentColor ?? undefined }}>
              {brand.communicationConcept}
            </p>
          )}
          {brand.description && (
            <p className="mt-3 text-muted-foreground whitespace-pre-line max-w-3xl">{brand.description}</p>
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
