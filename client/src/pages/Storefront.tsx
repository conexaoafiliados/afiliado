import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

function formatBrl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Storefront() {
  const params = new URLSearchParams(window.location.search);
  const affiliate = params.get("a");
  const linkId = Number(params.get("l") || 0);
  const { data, isLoading, isError } = trpc.affiliateProgram.vitrine.useQuery();
  const recordClick = trpc.affiliateProgram.recordClick.useMutation();
  const [counted, setCounted] = useState(false);

  useEffect(() => {
    if (counted || !linkId) return;
    const key = `cc-click-${linkId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setCounted(true);
    recordClick.mutate({ linkId });
  }, [counted, linkId, recordClick]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const products = (data?.products ?? []).filter(product => product.priceCents);
  const search = new URLSearchParams();
  if (affiliate) search.set("a", affiliate);
  if (linkId) search.set("l", String(linkId));
  const suffix = search.toString() ? `?${search.toString()}` : "";

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-10">
      <div>
        <h1 className="text-3xl font-semibold">Loja</h1>
        <p className="text-sm text-muted-foreground">Escolha um produto para ir à página de compra.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map(product => {
          const image = product.imageUrls[0];
          return (
            <article key={product.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="aspect-square bg-muted">
                {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="space-y-3 p-4">
                <h2 className="font-medium">{product.name}</h2>
                <p className="font-semibold">{formatBrl(product.priceCents ?? 0)}</p>
                <Link
                  href={`/oferta/${product.brandSlug}/${product.slug}${suffix}`}
                  className="inline-flex h-10 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
                >
                  Comprar
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {isError && <p className="text-sm text-muted-foreground">Não foi possível carregar a loja.</p>}
      {!isError && products.length === 0 && <p className="text-sm text-muted-foreground">Nenhum produto com preço publicado.</p>}
    </main>
  );
}
