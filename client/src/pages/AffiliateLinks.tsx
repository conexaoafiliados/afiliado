import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Copy, Link2, Plus, Share2, Store, Tag } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

function linkUrl(username: string, link: { id: number; destination: string; brandSlug: string | null; productSlug: string | null }) {
  const path =
    link.destination === "produto" && link.brandSlug && link.productSlug
      ? `/oferta/${link.brandSlug}/${link.productSlug}`
      : "/loja";
  const url = new URL(path, window.location.origin);
  url.searchParams.set("a", username);
  url.searchParams.set("l", String(link.id));
  return url.toString();
}

async function copy(url: string) {
  await navigator.clipboard.writeText(url);
  toast.success("Link copiado");
}

async function share(url: string, title: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      return;
    }
  }
  await copy(url);
}

export default function AffiliateLinks() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const desk = trpc.affiliateProgram.desk.useQuery();
  const createLink = trpc.affiliateProgram.createLink.useMutation({
    onSuccess: () => {
      utils.affiliateProgram.desk.invalidate();
      setOpen(false);
      setLabel("");
    },
    onError: error => toast.error(error.message),
  });
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [destination, setDestination] = useState<"loja" | "produto">("loja");
  const [productId, setProductId] = useState<number | "">("");
  const username = desk.data?.username ?? user?.username ?? null;
  const data = desk.data;

  function generatedProduct(productIdValue: number) {
    return (data?.links ?? []).find(link => !link.custom && link.brandProductId === productIdValue);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Cupom e links</h1>
        <p className="text-sm text-muted-foreground">Seu cupom e seus links, prontos para colar no story.</p>
      </div>

      {!username && (
        <p className="text-sm">
          Defina seu usuário em <Link href="/profile/edit" className="underline">Meu perfil</Link> para liberar os links.
        </p>
      )}
      {data && !data.ready && <p className="text-sm text-muted-foreground">{data.message}</p>}

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <p className="font-medium">Duas formas de vender (use as duas)</p>
        <p className="mt-3">
          <Tag className="mr-2 inline h-4 w-4" />
          Cupom: a pessoa digita o código na compra, ganha desconto e a venda conta para você. Bom para falar no vídeo.
        </p>
        <p className="mt-2">
          <Link2 className="mr-2 inline h-4 w-4" />
          Link: a pessoa toca no link, compra, e a venda conta para você, mesmo sem usar o cupom. Bom para colar no story e na bio.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">SEU CUPOM</p>
        {data?.coupon ? (
          <>
            <p className="mt-2 text-3xl font-semibold tracking-wide">{data.coupon.code}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Stat label="Desconto" value={`${data.coupon.discountPercent}%`} />
              <Stat label="Usos pagos" value={String(data.coupon.uses)} />
              <Stat label="Você ganha" value="Comissão do produto" />
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => copy(data.coupon!.code)}>
                <Copy className="mr-2 h-4 w-4" /> Copiar
              </Button>
              <Button className="flex-1 rounded-full" onClick={() => share(data.coupon!.code, data.coupon!.code)}>
                <Share2 className="mr-2 h-4 w-4" /> Compartilhar
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">A equipe ainda não liberou o seu cupom.</p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 p-4">
          <h2 className="font-semibold">Seus links</h2>
          <Button type="button" size="sm" className="rounded-full" disabled={!username} onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Link personalizado
          </Button>
        </div>
        <div className="divide-y divide-border">
          {username && data?.storeLink && (
            <LinkRow
              icon={<Store className="h-4 w-4" />}
              title={data.storeLink.label}
              url={linkUrl(username, { ...data.storeLink, brandSlug: null, productSlug: null })}
              clicks={data.storeLink.clicks}
              note={data.storeLink.note}
            />
          )}
          {(data?.products ?? []).map(product => {
            const generated = generatedProduct(product.id);
            return generated && username ? (
              <LinkRow
                key={product.id}
                icon={<Tag className="h-4 w-4" />}
                title={product.name}
                url={linkUrl(username, {
                  id: generated.id,
                  destination: "produto",
                  brandSlug: product.brandSlug,
                  productSlug: product.slug,
                })}
                clicks={generated.clicks}
                note={generated.note}
              />
            ) : (
              <div key={product.id} className="flex items-center justify-between gap-3 px-4 py-4">
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">Ainda não gerado</p>
                </div>
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={!username || createLink.isPending}
                  onClick={() =>
                    createLink.mutate({
                      label: product.name,
                      destination: "produto",
                      brandProductId: product.id,
                      custom: false,
                    })
                  }
                >
                  <Link2 className="mr-2 h-4 w-4" /> Gerar link
                </Button>
              </div>
            );
          })}
          {username &&
            (data?.links ?? [])
              .filter(link => link.custom)
              .map(link => (
                <LinkRow
                  key={link.id}
                  icon={<Link2 className="h-4 w-4" />}
                  title={link.label}
                  url={linkUrl(username, link)}
                  clicks={link.clicks}
                  note={link.note}
                />
              ))}
        </div>
      </section>

      {open && (
        <form
          className="space-y-3 rounded-2xl border border-border bg-card p-4"
          onSubmit={event => {
            event.preventDefault();
            createLink.mutate({
              label: label.trim(),
              destination,
              brandProductId: destination === "produto" && productId ? Number(productId) : null,
              custom: true,
            });
          }}
        >
          <p className="font-medium">Link personalizado</p>
          <p className="text-sm text-muted-foreground">O destino é o site geral ou a página de um produto.</p>
          <Input value={label} placeholder="Nome do link" onChange={event => setLabel(event.target.value)} />
          <div className="flex gap-2">
            <Button type="button" variant={destination === "loja" ? "default" : "outline"} onClick={() => setDestination("loja")}>
              Site geral
            </Button>
            <Button type="button" variant={destination === "produto" ? "default" : "outline"} onClick={() => setDestination("produto")}>
              Produto
            </Button>
          </div>
          {destination === "produto" && (
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={productId}
              onChange={event => setProductId(event.target.value ? Number(event.target.value) : "")}
            >
              <option value="">Escolha o produto</option>
              {(data?.products ?? []).map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          )}
          <Button type="submit" disabled={label.trim().length < 2 || createLink.isPending || (destination === "produto" && !productId)}>
            Criar link
          </Button>
        </form>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function LinkRow({
  icon,
  title,
  url,
  clicks,
  note,
}: {
  icon: ReactNode;
  title: string;
  url: string;
  clicks: number;
  note: string | null;
}) {
  const shown = url.replace(/^https?:\/\//, "");
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-4">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </p>
        <p className="truncate text-xs text-muted-foreground">{shown}</p>
        {note ? <p className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-xs">{note}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-muted-foreground">{clicks} cliques</span>
        <Button variant="outline" size="icon" className="rounded-full" aria-label="Copiar link" onClick={() => copy(url)}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
