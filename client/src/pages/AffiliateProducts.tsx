import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Copy, Link2, Share2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

function formatBrl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AffiliateProducts() {
  const { user } = useAuth();
  const { data } = trpc.affiliateProgram.catalog.useQuery();
  const [links, setLinks] = useState<Record<number, string>>({});
  const username = user?.username ?? null;

  function linkFor(brandSlug: string, productSlug: string) {
    const url = new URL(`/oferta/${brandSlug}/${productSlug}`, window.location.origin);
    if (username) url.searchParams.set("a", username);
    return url.toString();
  }

  async function share(url: string, name: string) {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <p className="text-sm text-muted-foreground">
          Selecionados pela marca. O link é a página de compra e a comissão fica na sua conta quando o pagamento confirma.
        </p>
      </div>
      {!username && (
        <p className="text-sm">
          Defina seu usuário em <Link href="/profile/edit" className="underline">Meu perfil</Link> para gerar o link.
        </p>
      )}
      {data && !data.ready && <p className="text-sm text-muted-foreground">{data.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(data?.products ?? []).map(product => {
          const image = product.imageUrls[0];
          const ready = Boolean(product.priceCents);
          const generated = links[product.id];
          const showPromo = Boolean(product.promo || product.compareAtCents);
          return (
            <article key={product.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-square bg-muted">
                {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : null}
                {showPromo && (
                  <span className="absolute right-3 top-3 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                    PROMO
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <h2 className="line-clamp-2 text-sm font-medium">{product.name}</h2>
                {ready && product.priceCents ? (
                  <p className="text-sm">
                    <span className="font-semibold">{formatBrl(product.priceCents)}</span>
                    {product.compareAtCents ? (
                      <span className="ml-2 text-muted-foreground line-through">{formatBrl(product.compareAtCents)}</span>
                    ) : null}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">A equipe ainda não definiu o preço deste produto.</p>
                )}
                {ready && (
                  <p className="text-xs font-medium text-emerald-700">
                    +{formatBrl(product.commissionCents ?? 0)} por venda
                  </p>
                )}
                <div className="mt-auto flex gap-2 pt-2">
                  {generated ? (
                    <>
                      <Button className="flex-1 rounded-full" onClick={() => share(generated, product.name)}>
                        <Share2 className="mr-2 h-4 w-4" /> Compartilhar
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        aria-label="Copiar link"
                        onClick={async () => {
                          await navigator.clipboard.writeText(generated);
                          toast.success("Link copiado");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full rounded-full"
                      disabled={!username || !ready}
                      onClick={() => setLinks(current => ({ ...current, [product.id]: linkFor(product.brandSlug, product.slug) }))}
                    >
                      <Link2 className="mr-2 h-4 w-4" /> Gerar link
                    </Button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
