import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { IMAGE_SIZE_HINTS } from "@/lib/prepareImage";
import type { PointRules } from "@shared/affiliateProgram";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ProgramAdmin() {
  const utils = trpc.useUtils();
  const rules = trpc.affiliateProgram.admin.rules.useQuery();
  const products = trpc.affiliateProgram.admin.products.useQuery();
  const materials = trpc.affiliateProgram.admin.materials.useQuery();
  const sales = trpc.affiliateProgram.admin.sales.useQuery();

  const [ruleDraft, setRuleDraft] = useState<PointRules | null>(null);
  const [materialTitle, setMaterialTitle] = useState("");
  const [file, setFile] = useState<{ base64: string; mime: string } | null>(null);
  const saveRules = trpc.affiliateProgram.admin.saveRules.useMutation({
    onSuccess: () => {
      utils.affiliateProgram.admin.rules.invalidate();
      utils.affiliateProgram.points.invalidate();
      toast.success("Regulamento atualizado");
    },
    onError: error => toast.error(error.message),
  });
  const setPoints = trpc.affiliateProgram.admin.setProductPoints.useMutation({
    onSuccess: () => {
      utils.affiliateProgram.admin.products.invalidate();
      utils.affiliateProgram.points.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const upload = trpc.affiliateProgram.admin.uploadMaterial.useMutation({
    onSuccess: () => {
      utils.affiliateProgram.admin.materials.invalidate();
      utils.affiliateProgram.materials.invalidate();
      setMaterialTitle("");
      setFile(null);
      toast.success("Material disponível para download");
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.affiliateProgram.admin.deleteMaterial.useMutation({
    onSuccess: () => {
      utils.affiliateProgram.admin.materials.invalidate();
      utils.affiliateProgram.materials.invalidate();
    },
  });
  const saveSale = trpc.affiliateProgram.admin.saveSale.useMutation({
    onSuccess: () => {
      utils.affiliateProgram.admin.sales.invalidate();
      utils.affiliateProgram.catalog.invalidate();
      toast.success("Preço e comissão salvos");
    },
    onError: error => toast.error(error.message),
  });
  const coproducers = trpc.affiliateProgram.admin.coproducers.useQuery();
  const coupons = trpc.affiliateProgram.admin.coupons.useQuery();
  const [couponUser, setCouponUser] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState("0");
  const addPartner = trpc.affiliateProgram.admin.addCoproducer.useMutation({
    onSuccess: () => {
      utils.affiliateProgram.admin.coproducers.invalidate();
      toast.success("Co-produção salva");
    },
    onError: error => toast.error(error.message),
  });
  const removePartner = trpc.affiliateProgram.admin.removeCoproducer.useMutation({
    onSuccess: () => utils.affiliateProgram.admin.coproducers.invalidate(),
    onError: error => toast.error(error.message),
  });
  const saveCoupon = trpc.affiliateProgram.admin.saveCoupon.useMutation({
    onSuccess: () => {
      utils.affiliateProgram.admin.coupons.invalidate();
      setCouponUser("");
      setCouponCode("");
      setCouponDiscount("0");
      toast.success("Cupom salvo");
    },
    onError: error => toast.error(error.message),
  });
  const removeCoupon = trpc.affiliateProgram.admin.deleteCoupon.useMutation({
    onSuccess: () => utils.affiliateProgram.admin.coupons.invalidate(),
  });

  const loadedRules: PointRules | null = rules.data
    ? {
        storyPoints: rules.data.storyPoints,
        feedPoints: rules.data.feedPoints,
        reelPoints: rules.data.reelPoints,
        salePoints: rules.data.salePoints,
        redeemMinPoints: rules.data.redeemMinPoints,
        redeemMinSales: rules.data.redeemMinSales,
        redeemItemLimit: rules.data.redeemItemLimit,
        redeemDays: rules.data.redeemDays,
      }
    : null;
  const draft = ruleDraft ?? loadedRules;
  const migration = rules.data?.message;

  return (
    <div className="space-y-6">
      {migration && (
        <Card className="p-4 text-sm">
          As tabelas do programa ainda não existem neste banco. {migration}
        </Card>
      )}

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Pontos do regulamento</h2>
        <p className="text-sm text-muted-foreground">
          Os pontos são trocados por produto. Estes números valem para stories, feed, reels e vendas. As metas em si ficam em Missões.
        </p>
        {draft && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["storyPoints", "Stories"],
                ["feedPoints", "Feed"],
                ["reelPoints", "Reels"],
                ["salePoints", "Venda"],
                ["redeemMinPoints", "Pontos mínimos para trocar"],
                ["redeemMinSales", "Vendas mínimas para trocar"],
                ["redeemItemLimit", "Itens por troca"],
                ["redeemDays", "Dias para escolher"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  type="number"
                  value={draft[key]}
                  onChange={event =>
                    draft &&
                    setRuleDraft({ ...draft, [key]: Number(event.target.value) })
                  }
                />
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          disabled={!draft || saveRules.isPending}
          onClick={() =>
            draft &&
            saveRules.mutate({
              storyPoints: Number(draft.storyPoints),
              feedPoints: Number(draft.feedPoints),
              reelPoints: Number(draft.reelPoints),
              salePoints: Number(draft.salePoints),
              redeemMinPoints: Number(draft.redeemMinPoints),
              redeemMinSales: Number(draft.redeemMinSales),
              redeemItemLimit: Number(draft.redeemItemLimit),
              redeemDays: Number(draft.redeemDays),
            })
          }
        >
          Salvar regulamento
        </Button>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Pontos de cada produto</h2>
        <p className="text-sm text-muted-foreground">Zero tira o produto da troca. O valor é o que você digitar.</p>
        {products.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ul className="divide-y divide-border">
            {(products.data?.products ?? []).map(product => (
              <li key={product.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.brandName}</p>
                </div>
                <Input
                  className="w-24"
                  type="number"
                  min={0}
                  defaultValue={product.pointsCost ?? 0}
                  onBlur={event =>
                    setPoints.mutate({
                      brandProductId: product.id,
                      pointsCost: Math.max(0, Number(event.target.value) || 0),
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Preço, comissão e co-produção</h2>
        <p className="text-sm text-muted-foreground">
          O preço é o que o cliente paga. A comissão fica com a afiliada do link ou do cupom. A co-produção é o derramamento: cada usuário listado ganha o valor em toda venda paga deste produto.
        </p>
        {sales.data && !sales.data.ready && <p className="text-sm text-muted-foreground">{sales.data.message}</p>}
        <ul className="divide-y divide-border">
          {(sales.data?.products ?? []).map(product => (
            <SaleRow
              key={product.id}
              name={product.name}
              brandName={product.brandName}
              priceCents={product.priceCents}
              compareAtCents={product.compareAtCents}
              commissionCents={product.commissionCents}
              promo={product.promo ?? false}
              pending={saveSale.isPending}
              partners={(coproducers.data?.people ?? []).filter(person => person.brandProductId === product.id)}
              onSave={values => saveSale.mutate({ brandProductId: product.id, ...values })}
              onAddPartner={(username, amountCents) =>
                addPartner.mutate({ brandProductId: product.id, username, amountCents })
              }
              onRemovePartner={id => removePartner.mutate({ id })}
            />
          ))}
        </ul>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Cupons das afiliadas</h2>
        <p className="text-sm text-muted-foreground">
          Um cupom por pessoa. O desconto sai do preço na página de compra. A comissão continua sendo a do produto.
        </p>
        <div className="grid gap-3 sm:grid-cols-4">
          <Input value={couponUser} placeholder="usuário" onChange={event => setCouponUser(event.target.value)} />
          <Input value={couponCode} placeholder="CUPOM" onChange={event => setCouponCode(event.target.value.toUpperCase())} />
          <Input value={couponDiscount} placeholder="% desconto" onChange={event => setCouponDiscount(event.target.value)} />
          <Button
            type="button"
            disabled={couponUser.trim().length < 1 || couponCode.trim().length < 4 || saveCoupon.isPending}
            onClick={() =>
              saveCoupon.mutate({
                username: couponUser.trim(),
                code: couponCode.trim(),
                discountPercent: Math.min(90, Math.max(0, Number(couponDiscount) || 0)),
              })
            }
          >
            Salvar cupom
          </Button>
        </div>
        <ul className="divide-y divide-border">
          {(coupons.data?.coupons ?? []).map(coupon => (
            <li key={coupon.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>
                {coupon.code} · @{coupon.username} · {coupon.discountPercent}% · {coupon.uses} usos pagos
              </span>
              <button type="button" onClick={() => removeCoupon.mutate({ id: coupon.id })} aria-label="Remover cupom">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Materiais</h2>
        <p className="text-sm text-muted-foreground">
          PNG, JPG, WEBP, GIF, PDF ou MP4 até 8 MB. A afiliada baixa ao clicar. {IMAGE_SIZE_HINTS.material}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Título</Label>
            <Input value={materialTitle} onChange={event => setMaterialTitle(event.target.value)} />
          </div>
          <div>
            <Label>Arquivo</Label>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,video/mp4"
              onChange={event => {
                const picked = event.target.files?.[0];
                if (!picked) return;
                if (picked.size > 8 * 1024 * 1024) {
                  toast.error("Arquivo maior que 8 MB");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  const raw = String(reader.result ?? "");
                  setFile({ base64: raw.split(",")[1] ?? "", mime: picked.type });
                  if (!materialTitle) setMaterialTitle(picked.name.replace(/\.[^.]+$/, ""));
                };
                reader.readAsDataURL(picked);
              }}
            />
          </div>
        </div>
        <Button
          type="button"
          disabled={!file || materialTitle.trim().length < 2 || upload.isPending}
          onClick={() => file && upload.mutate({ title: materialTitle, base64: file.base64, mime: file.mime as "image/png" })}
        >
          Publicar material
        </Button>
        <ul className="divide-y divide-border">
          {(materials.data?.materials ?? []).map(item => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>{item.title}</span>
              <button type="button" onClick={() => remove.mutate({ id: item.id })} aria-label="Remover">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function centsToInput(cents: number | null | undefined) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

function inputToCents(value: string) {
  const parsed = Number(value.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100);
}

function SaleRow({
  name,
  brandName,
  priceCents,
  compareAtCents,
  commissionCents,
  promo,
  pending,
  partners,
  onSave,
  onAddPartner,
  onRemovePartner,
}: {
  name: string;
  brandName: string;
  priceCents: number | null;
  compareAtCents: number | null;
  commissionCents: number | null;
  promo: boolean;
  pending: boolean;
  partners: { id: number; username: string | null; name: string | null; amountCents: number }[];
  onSave: (values: {
    priceCents: number;
    compareAtCents: number | null;
    commissionCents: number;
    promo: boolean;
  }) => void;
  onAddPartner: (username: string, amountCents: number) => void;
  onRemovePartner: (id: number) => void;
}) {
  const [price, setPrice] = useState(centsToInput(priceCents));
  const [compare, setCompare] = useState(centsToInput(compareAtCents));
  const [commission, setCommission] = useState(centsToInput(commissionCents));
  const [isPromo, setIsPromo] = useState(promo);
  const [partnerUser, setPartnerUser] = useState("");
  const [partnerAmount, setPartnerAmount] = useState("");

  function save(nextPromo = isPromo) {
    const nextPrice = inputToCents(price);
    if (!nextPrice) return;
    const nextCompare = compare.trim() ? inputToCents(compare) : null;
    const nextCommission = inputToCents(commission) ?? 0;
    onSave({
      priceCents: nextPrice,
      compareAtCents: nextCompare,
      commissionCents: nextCommission,
      promo: nextPromo,
    });
  }

  return (
    <li className="grid gap-2 py-3 sm:grid-cols-[1fr_repeat(3,7rem)_auto]">
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{brandName}</p>
      </div>
      <Input value={price} placeholder="Preço" onChange={event => setPrice(event.target.value)} onBlur={() => save()} />
      <Input value={compare} placeholder="De" onChange={event => setCompare(event.target.value)} onBlur={() => save()} />
      <Input value={commission} placeholder="Comissão" onChange={event => setCommission(event.target.value)} onBlur={() => save()} />
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={isPromo}
          disabled={pending}
          onChange={event => {
            setIsPromo(event.target.checked);
            save(event.target.checked);
          }}
        />
        Promo
      </label>
      <div className="sm:col-span-5 space-y-2 rounded-xl bg-muted/50 p-3">
        <p className="text-xs font-medium">Co-produção deste produto</p>
        {partners.map(person => (
          <div key={person.id} className="flex items-center justify-between gap-2 text-sm">
            <span>
              @{person.username ?? person.name} · {centsToInput(person.amountCents)} por venda
            </span>
            <button type="button" onClick={() => onRemovePartner(person.id)} aria-label="Remover co-produção">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Input className="w-36" value={partnerUser} placeholder="usuário" onChange={event => setPartnerUser(event.target.value)} />
          <Input className="w-28" value={partnerAmount} placeholder="R$ por venda" onChange={event => setPartnerAmount(event.target.value)} />
          <Button
            type="button"
            variant="outline"
            disabled={!partnerUser.trim() || !inputToCents(partnerAmount)}
            onClick={() => {
              const amount = inputToCents(partnerAmount);
              if (!amount) return;
              onAddPartner(partnerUser.trim(), amount);
              setPartnerUser("");
              setPartnerAmount("");
            }}
          >
            Adicionar
          </Button>
        </div>
      </div>
    </li>
  );
}
