import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { toast } from "sonner";

function formatBrl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function OfferLanding() {
  const [, params] = useRoute("/oferta/:brandSlug/:productSlug");
  const brandSlug = params?.brandSlug ?? "";
  const productSlug = params?.productSlug ?? "";
  const search = new URLSearchParams(window.location.search);
  const affiliateUsername = search.get("a") ?? undefined;
  const linkId = Number(search.get("l") || 0);
  const [coupon, setCoupon] = useState("");
  const [counted, setCounted] = useState(false);
  const recordClick = trpc.affiliateProgram.recordClick.useMutation();
  const { data, isLoading, isError } = trpc.affiliateProgram.offer.useQuery(
    { brandSlug, productSlug },
    { enabled: Boolean(brandSlug && productSlug) }
  );
  const checkout = trpc.affiliateProgram.checkout.useMutation({
    onSuccess: result => {
      window.location.href = result.url;
    },
    onError: error => toast.error(error.message),
  });
  const product = data?.product;

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

  if (isError) {
    return (
      <main className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-semibold">Não foi possível abrir o produto</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tente de novo em instantes.</p>
      </main>
    );
  }

  if (!data?.ready) {
    return (
      <main className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-semibold">Vitrine em preparação</h1>
        <p className="mt-2 text-sm text-muted-foreground">{data?.message ?? "O catálogo de venda ainda não está disponível."}</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-semibold">Produto indisponível</h1>
        <p className="mt-2 text-sm text-muted-foreground">Este link não está publicado ou o preço ainda não foi definido.</p>
      </main>
    );
  }

  const image = product.imageUrls[0];

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl gap-8 p-4 md:grid-cols-2 md:p-10">
      <div className="overflow-hidden rounded-3xl bg-muted">
        {image ? <img src={image} alt="" className="aspect-square w-full object-cover" /> : null}
      </div>
      <div className="flex flex-col justify-center gap-4">
        <p className="text-sm text-muted-foreground">{product.brandName}</p>
        <h1 className="text-3xl font-semibold">{product.name}</h1>
        {product.description ? <p className="text-muted-foreground whitespace-pre-line">{product.description}</p> : null}
        {product.priceCents ? (
          <p className="text-2xl font-semibold">
            {formatBrl(product.priceCents)}
            {product.compareAtCents ? (
              <span className="ml-2 text-base font-normal text-muted-foreground line-through">
                {formatBrl(product.compareAtCents)}
              </span>
            ) : null}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Este produto ainda não está à venda.</p>
        )}
        <Input value={coupon} placeholder="Cupom" onChange={event => setCoupon(event.target.value.toUpperCase())} />
        <Button
          className="h-12 rounded-full text-base"
          disabled={!product.priceCents || checkout.isPending}
          onClick={() =>
            checkout.mutate({
              brandSlug,
              productSlug,
              affiliateUsername,
              couponCode: coupon.trim() || undefined,
            })
          }
        >
          {checkout.isPending ? "Abrindo pagamento..." : "Comprar"}
        </Button>
        <p className="text-xs text-muted-foreground">O pagamento abre na InfinitePay. Depois você volta para esta página.</p>
      </div>
    </main>
  );
}
