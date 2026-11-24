import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { prepareImageForUpload, IMAGE_SIZE_HINTS } from "@/lib/prepareImage";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  BRAND_STATUS_LABELS,
  OFFER_CHANNEL_LABELS,
  OFFER_CHANNELS,
  PRODUCT_STATUS_LABELS,
  SLUG_HINT,
  canTransitionStatus,
  getBrandPublishIssues,
  getProductPublishIssues,
  slugify,
  type BrandStatus,
  type OfferChannel,
} from "@shared/brands";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type BrandForm = {
  id?: number;
  name: string;
  slug: string;
  description: string;
  communicationConcept: string;
  accentColor: string;
  logoUrl: string;
  coverUrl: string;
  sortOrder: string;
};

type ProductForm = {
  id?: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  usageGuidelines: string;
  approvedInfo: string;
  imageUrls: string[];
  sortOrder: string;
};

type OfferForm = {
  id?: number;
  channel: OfferChannel;
  label: string;
  url: string;
  notes: string;
  isActive: boolean;
};

type MaterialForm = { label: string; url: string };

type AdminProduct = {
  id: number;
  brandId: number;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  imageUrls: string[];
  usageGuidelines: string | null;
  approvedInfo: string | null;
  referenceMaterials: { label: string; url: string }[];
  status: string;
  sortOrder: number;
  offers: {
    id: number;
    brandProductId: number;
    channel: string;
    label: string | null;
    url: string;
    notes: string | null;
    isActive: boolean;
    sortOrder: number;
  }[];
};

const emptyBrand = (): BrandForm => ({
  name: "",
  slug: "",
  description: "",
  communicationConcept: "",
  accentColor: "",
  logoUrl: "",
  coverUrl: "",
  sortOrder: "0",
});

const emptyProduct = (): ProductForm => ({
  name: "",
  slug: "",
  description: "",
  category: "",
  usageGuidelines: "",
  approvedInfo: "",
  imageUrls: [],
  sortOrder: "0",
});

const emptyOffer = (): OfferForm => ({
  channel: "outro",
  label: "",
  url: "",
  notes: "",
  isActive: true,
});

function StatusBadge({ status, kind }: { status: BrandStatus; kind: "brand" | "product" }) {
  const labels = kind === "brand" ? BRAND_STATUS_LABELS : PRODUCT_STATUS_LABELS;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        status === "published" && "bg-emerald-100 text-emerald-800",
        status === "draft" && "bg-amber-100 text-amber-800",
        status === "archived" && "bg-muted text-muted-foreground"
      )}
    >
      {labels[status]}
    </span>
  );
}

function StatusActions({
  status,
  publishIssues,
  pending,
  onChange,
}: {
  status: BrandStatus;
  publishIssues: string[];
  pending: boolean;
  onChange: (next: BrandStatus) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {canTransitionStatus(status, "published") && (
        <Button
          type="button"
          size="sm"
          className="btn-primary"
          disabled={pending || publishIssues.length > 0}
          title={publishIssues.join(" ") || undefined}
          onClick={() => onChange("published")}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          Publicar
        </Button>
      )}
      {canTransitionStatus(status, "draft") && status === "published" && (
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => onChange("draft")}>
          Voltar a rascunho
        </Button>
      )}
      {canTransitionStatus(status, "archived") && (
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => onChange("archived")}>
          <Archive className="h-3.5 w-3.5 mr-1" />
          Arquivar
        </Button>
      )}
      {status === "archived" && (
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => onChange("draft")}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Restaurar para rascunho
        </Button>
      )}
    </div>
  );
}

function ImageField({
  label,
  kind,
  value,
  onChange,
}: {
  label: string;
  kind: "logo" | "cover" | "product";
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = trpc.brands.admin.uploadImage.useMutation();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const prepared = await prepareImageForUpload(file, kind === "logo" ? "logo" : "banner");
      if (!prepared.ok) {
        toast.error(prepared.error);
        return;
      }
      const result = await upload.mutateAsync({
        kind,
        base64: prepared.data.base64,
        mime: prepared.data.mime as "image/png" | "image/jpeg" | "image/webp",
      });
      onChange(result.url);
      toast.success("Imagem enviada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "overflow-hidden border border-border bg-muted/40 flex items-center justify-center",
            kind === "cover" ? "h-20 w-36 rounded-lg" : "h-16 w-16 rounded-xl"
          )}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-2 flex-1 min-w-0">
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Enviar imagem
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>
                Remover
              </Button>
            )}
          </div>
          <Input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="ou cole uma URL https://…"
            className="text-xs"
          />
          <p className="text-xs text-muted-foreground">
            {kind === "logo" ? IMAGE_SIZE_HINTS.logo : kind === "cover" ? IMAGE_SIZE_HINTS.cover : IMAGE_SIZE_HINTS.product}
          </p>
        </div>
      </div>
    </div>
  );
}

function BrandEditor({
  brandId,
  onBack,
  onCreated,
}: {
  brandId: number | "new";
  onBack: () => void;
  onCreated: (id: number) => void;
}) {
  const utils = trpc.useUtils();
  const isNew = brandId === "new";
  const { data, isLoading } = trpc.brands.admin.get.useQuery(
    { id: typeof brandId === "number" ? brandId : 0 },
    { enabled: typeof brandId === "number" }
  );

  const [form, setForm] = useState<BrandForm>(emptyBrand);
  const [slugTouched, setSlugTouched] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | "new" | null>(null);

  useEffect(() => {
    if (!data?.brand) return;
    const b = data.brand;
    setForm({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description ?? "",
      communicationConcept: b.communicationConcept ?? "",
      accentColor: b.accentColor ?? "",
      logoUrl: b.logoUrl ?? "",
      coverUrl: b.coverUrl ?? "",
      sortOrder: String(b.sortOrder ?? 0),
    });
    setSlugTouched(true);
  }, [data]);

  const saveBrand = trpc.brands.admin.saveBrand.useMutation({
    onSuccess: async saved => {
      toast.success(isNew ? "Marca criada (rascunho)" : "Marca salva");
      await utils.brands.admin.list.invalidate();
      if (isNew) onCreated(saved.id);
      else await utils.brands.admin.get.invalidate({ id: saved.id });
    },
    onError: err => toast.error(err.message),
  });

  const setStatus = trpc.brands.admin.setBrandStatus.useMutation({
    onSuccess: async () => {
      toast.success("Status atualizado");
      await Promise.all([utils.brands.admin.list.invalidate(), utils.brands.admin.get.invalidate({ id: form.id! })]);
    },
    onError: err => toast.error(err.message),
  });

  const publishIssues = useMemo(() => getBrandPublishIssues(form), [form]);
  const status = (data?.brand.status ?? "draft") as BrandStatus;

  function updateField<K extends keyof BrandForm>(key: K, value: BrandForm[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveBrand.mutate({
      id: form.id,
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      communicationConcept: form.communicationConcept || null,
      accentColor: form.accentColor || null,
      logoUrl: form.logoUrl || null,
      coverUrl: form.coverUrl || null,
      sortOrder: parseInt(form.sortOrder || "0", 10) || 0,
    });
  }

  if (!isNew && isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  if (selectedProductId !== null && form.id) {
    const product = selectedProductId === "new" ? undefined : data?.products.find(p => p.id === selectedProductId);
    return (
      <ProductEditor
        brandId={form.id}
        brandStatus={status}
        productId={selectedProductId}
        initial={product as AdminProduct | undefined}
        onBack={() => {
          setSelectedProductId(null);
          void utils.brands.admin.get.invalidate({ id: form.id! });
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <h2 className="text-lg font-semibold">{isNew ? "Nova marca" : form.name || "Editar marca"}</h2>
        {!isNew && <StatusBadge status={status} kind="brand" />}
      </div>

      {!isNew && (
        <div className="space-y-2">
          <StatusActions
            status={status}
            publishIssues={publishIssues}
            pending={setStatus.isPending}
            onChange={next => {
              if (
                next === "archived" &&
                !confirm("Arquivar esta marca? Ela deixa de aparecer publicamente, mas o histórico é preservado.")
              ) {
                return;
              }
              setStatus.mutate({ id: form.id!, status: next });
            }}
          />
          {publishIssues.length > 0 && status !== "published" && (
            <p className="text-xs text-muted-foreground">Para publicar: {publishIssues.join(" ")}</p>
          )}
        </div>
      )}

      <Card className="card-elegant p-5 space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Nome *</Label>
              <Input id="brand-name" required value={form.name} onChange={e => updateField("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-slug">Identificador de URL *</Label>
              <Input
                id="brand-slug"
                required
                value={form.slug}
                onChange={e => {
                  setSlugTouched(true);
                  updateField("slug", e.target.value.toLowerCase());
                }}
              />
              <p className="text-xs text-muted-foreground">{SLUG_HINT}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-concept">Conceito de comunicação</Label>
            <Input
              id="brand-concept"
              value={form.communicationConcept}
              onChange={e => updateField("communicationConcept", e.target.value)}
              placeholder='Ex.: "Liso no seu tempo"'
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-desc">Descrição {status === "published" ? "*" : ""}</Label>
            <Textarea
              id="brand-desc"
              rows={4}
              value={form.description}
              onChange={e => updateField("description", e.target.value)}
              placeholder="Texto curto e factual sobre a marca. Não invente benefícios."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand-color">Cor de destaque</Label>
              <div className="flex gap-2">
                <Input
                  id="brand-color"
                  value={form.accentColor}
                  onChange={e => updateField("accentColor", e.target.value)}
                  placeholder="#AABBCC"
                />
                <input
                  type="color"
                  aria-label="Seletor de cor"
                  className="h-10 w-12 rounded border border-input bg-background"
                  value={/^#[0-9a-fA-F]{6}$/.test(form.accentColor) ? form.accentColor : "#7c3aed"}
                  onChange={e => updateField("accentColor", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-order">Ordem de exibição</Label>
              <Input
                id="brand-order"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={e => updateField("sortOrder", e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <ImageField label="Logo" kind="logo" value={form.logoUrl} onChange={url => updateField("logoUrl", url)} />
            <ImageField label="Capa" kind="cover" value={form.coverUrl} onChange={url => updateField("coverUrl", url)} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="btn-primary" disabled={saveBrand.isPending}>
              {saveBrand.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isNew ? "Criar marca" : "Salvar marca"}
            </Button>
            {!isNew && form.slug && (
              <a href={`/marcas/${form.slug}`} target="_blank" rel="noreferrer">
                <Button type="button" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Ver página
                </Button>
              </a>
            )}
          </div>
          {isNew && (
            <p className="text-xs text-muted-foreground">
              A marca nasce como rascunho e só aparece publicamente depois de publicada.
            </p>
          )}
        </form>
      </Card>

      {!isNew && form.id && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Produtos desta marca</h3>
            <Button
              type="button"
              size="sm"
              className="btn-primary"
              disabled={status === "archived"}
              title={status === "archived" ? "Restaure a marca para adicionar produtos" : undefined}
              onClick={() => setSelectedProductId("new")}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Novo produto
            </Button>
          </div>

          {(data?.products ?? []).length === 0 ? (
            <Card className="card-elegant p-6 text-center text-sm text-muted-foreground">
              Nenhum produto cadastrado. Produtos em rascunho não aparecem publicamente.
            </Card>
          ) : (
            <div className="space-y-2">
              {(data?.products ?? []).map(p => (
                <Card
                  key={p.id}
                  className="card-elegant p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedProductId(p.id)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{p.name}</p>
                      <StatusBadge status={p.status as BrandStatus} kind="product" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      /{p.slug}
                      {p.category ? ` · ${p.category}` : ""}
                      {` · ${p.offers.length} ${p.offers.length === 1 ? "oferta" : "ofertas"}`}
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => setSelectedProductId(p.id)}>
                    Editar
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ProductEditor({
  brandId,
  brandStatus,
  productId,
  initial,
  onBack,
}: {
  brandId: number;
  brandStatus: BrandStatus;
  productId: number | "new";
  initial?: AdminProduct;
  onBack: () => void;
}) {
  const utils = trpc.useUtils();
  const isNew = productId === "new";
  const [form, setForm] = useState<ProductForm>(() =>
    initial
      ? {
          id: initial.id,
          name: initial.name,
          slug: initial.slug,
          description: initial.description ?? "",
          category: initial.category ?? "",
          usageGuidelines: initial.usageGuidelines ?? "",
          approvedInfo: initial.approvedInfo ?? "",
          imageUrls: initial.imageUrls ?? [],
          sortOrder: String(initial.sortOrder ?? 0),
        }
      : emptyProduct()
  );
  const [materials, setMaterials] = useState<MaterialForm[]>(
    () => initial?.referenceMaterials?.map(m => ({ label: m.label, url: m.url })) ?? []
  );
  const [offerDraft, setOfferDraft] = useState<OfferForm>(emptyOffer);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const status = (initial?.status ?? "draft") as BrandStatus;
  const offers = initial?.offers ?? [];

  const saveProduct = trpc.brands.admin.saveProduct.useMutation({
    onSuccess: async () => {
      toast.success(isNew ? "Produto criado (rascunho)" : "Produto salvo");
      await utils.brands.admin.get.invalidate({ id: brandId });
      if (isNew) onBack();
    },
    onError: err => toast.error(err.message),
  });

  const setStatus = trpc.brands.admin.setProductStatus.useMutation({
    onSuccess: async () => {
      toast.success("Status do produto atualizado");
      await utils.brands.admin.get.invalidate({ id: brandId });
    },
    onError: err => toast.error(err.message),
  });

  const saveOfferMut = trpc.brands.admin.saveOffer.useMutation({
    onSuccess: async () => {
      toast.success(offerDraft.id ? "Oferta atualizada" : "Oferta adicionada");
      setOfferDraft(emptyOffer());
      await utils.brands.admin.get.invalidate({ id: brandId });
    },
    onError: err => toast.error(err.message),
  });

  const removeOffer = trpc.brands.admin.deleteOffer.useMutation({
    onSuccess: async () => {
      toast.success("Oferta removida");
      await utils.brands.admin.get.invalidate({ id: brandId });
    },
    onError: err => toast.error(err.message),
  });

  const publishIssues = useMemo(() => getProductPublishIssues(form), [form]);

  function updateField<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveProduct.mutate({
      id: form.id,
      brandId,
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      category: form.category || null,
      usageGuidelines: form.usageGuidelines || null,
      approvedInfo: form.approvedInfo || null,
      imageUrls: form.imageUrls,
      referenceMaterials: materials.filter(m => m.label.trim() && m.url.trim()),
      sortOrder: parseInt(form.sortOrder || "0", 10) || 0,
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <Button type="button" size="sm" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar à marca
        </Button>
        <h2 className="text-lg font-semibold">{isNew ? "Novo produto" : form.name || "Editar produto"}</h2>
        {!isNew && <StatusBadge status={status} kind="product" />}
      </div>

      {!isNew && form.id && (
        <div className="space-y-2">
          <StatusActions
            status={status}
            publishIssues={publishIssues}
            pending={setStatus.isPending}
            onChange={next => {
              if (
                next === "archived" &&
                !confirm("Arquivar este produto? Ele sai das novas seleções, mas o histórico é preservado.")
              ) {
                return;
              }
              setStatus.mutate({ id: form.id!, status: next });
            }}
          />
          {publishIssues.length > 0 && status !== "published" && (
            <p className="text-xs text-muted-foreground">Para publicar: {publishIssues.join(" ")}</p>
          )}
          {brandStatus !== "published" && status === "published" && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              A marca ainda não está publicada. O produto só aparece publicamente quando a marca também estiver
              publicada.
            </p>
          )}
        </div>
      )}

      <Card className="card-elegant p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input required value={form.name} onChange={e => updateField("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Identificador de URL *</Label>
              <Input
                required
                value={form.slug}
                onChange={e => {
                  setSlugTouched(true);
                  updateField("slug", e.target.value.toLowerCase());
                }}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                value={form.category}
                onChange={e => updateField("category", e.target.value)}
                placeholder="Ex.: Body splash, Capilar…"
              />
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={e => updateField("sortOrder", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={e => updateField("description", e.target.value)}
              placeholder="Informações confirmadas sobre o produto."
            />
          </div>

          <div className="space-y-2">
            <Label>Orientações de uso</Label>
            <Textarea
              rows={3}
              value={form.usageGuidelines}
              onChange={e => updateField("usageGuidelines", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Informações aprovadas</Label>
            <Textarea
              rows={3}
              value={form.approvedInfo}
              onChange={e => updateField("approvedInfo", e.target.value)}
              placeholder="Texto que creators podem usar. Não invente benefícios."
            />
          </div>

          <div className="space-y-2">
            <Label>Imagens do produto</Label>
            <div className="flex flex-wrap gap-2">
              {form.imageUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 rounded bg-black/60 text-white p-0.5"
                    onClick={() => updateField(
                      "imageUrls",
                      form.imageUrls.filter((_, i) => i !== idx)
                    )}
                    aria-label="Remover imagem"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            {form.imageUrls.length < 8 && (
              <ImageField
                label="Adicionar imagem"
                kind="product"
                value=""
                onChange={url => {
                  if (url) updateField("imageUrls", [...form.imageUrls, url]);
                }}
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Materiais de referência</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setMaterials(prev => [...prev, { label: "", url: "" }])}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Material
              </Button>
            </div>
            {materials.map((m, idx) => (
              <div key={idx} className="grid sm:grid-cols-[1fr_2fr_auto] gap-2">
                <Input
                  placeholder="Nome"
                  value={m.label}
                  onChange={e =>
                    setMaterials(prev => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                  }
                />
                <Input
                  placeholder="https://…"
                  value={m.url}
                  onChange={e =>
                    setMaterials(prev => prev.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)))
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setMaterials(prev => prev.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="submit" className="btn-primary" disabled={saveProduct.isPending}>
            {saveProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isNew ? "Criar produto" : "Salvar produto"}
          </Button>
        </form>
      </Card>

      {!isNew && form.id && (
        <Card className="card-elegant p-5 space-y-4">
          <div>
            <h3 className="font-semibold">Links oficiais de compra / ofertas</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Diferencie o produto apresentado em campanhas de uma oferta de compra. O app não gerencia estoque,
              pagamento nem entrega dessas ofertas.
            </p>
          </div>

          {offers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma oferta cadastrada.</p>
          ) : (
            <ul className="space-y-2">
              {offers.map(o => (
                <li
                  key={o.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between border border-border rounded-lg p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {OFFER_CHANNEL_LABELS[(o.channel as OfferChannel) ?? "outro"] ?? o.channel}
                      {o.label ? ` — ${o.label}` : ""}
                      {!o.isActive && <span className="ml-2 text-xs text-muted-foreground">(inativa)</span>}
                    </p>
                    <a
                      href={o.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-accent hover:underline truncate block"
                    >
                      {o.url}
                    </a>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setOfferDraft({
                          id: o.id,
                          channel: (OFFER_CHANNELS.includes(o.channel as OfferChannel)
                            ? o.channel
                            : "outro") as OfferChannel,
                          label: o.label ?? "",
                          url: o.url,
                          notes: o.notes ?? "",
                          isActive: o.isActive,
                        })
                      }
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={removeOffer.isPending}
                      onClick={() => {
                        if (confirm("Remover esta oferta?")) removeOffer.mutate({ id: o.id });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form
            className="space-y-3 border-t border-border pt-4"
            onSubmit={e => {
              e.preventDefault();
              saveOfferMut.mutate({
                id: offerDraft.id,
                brandProductId: form.id!,
                channel: offerDraft.channel,
                label: offerDraft.label || null,
                url: offerDraft.url,
                notes: offerDraft.notes || null,
                isActive: offerDraft.isActive,
              });
            }}
          >
            <p className="text-sm font-medium">{offerDraft.id ? "Editar oferta" : "Nova oferta"}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Canal</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={offerDraft.channel}
                  onChange={e => setOfferDraft(prev => ({ ...prev, channel: e.target.value as OfferChannel }))}
                >
                  {OFFER_CHANNELS.map(c => (
                    <option key={c} value={c}>
                      {OFFER_CHANNEL_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Rótulo (opcional)</Label>
                <Input
                  value={offerDraft.label}
                  onChange={e => setOfferDraft(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Ex.: Kit lançamento"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>URL *</Label>
              <Input
                required
                value={offerDraft.url}
                onChange={e => setOfferDraft(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1">
              <Label>Notas internas</Label>
              <Input
                value={offerDraft.notes}
                onChange={e => setOfferDraft(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={offerDraft.isActive}
                onChange={e => setOfferDraft(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              Oferta ativa (visível na página pública do produto)
            </label>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="btn-primary" disabled={saveOfferMut.isPending}>
                {saveOfferMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                {offerDraft.id ? "Salvar oferta" : "Adicionar oferta"}
              </Button>
              {offerDraft.id && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setOfferDraft(emptyOffer())}>
                  Cancelar edição
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

export function BrandsAdmin() {
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);
  const { data: brands = [], isLoading, isError, error, refetch } = trpc.brands.admin.list.useQuery();

  if (selectedId !== null) {
    return (
      <BrandEditor
        brandId={selectedId}
        onBack={() => setSelectedId(null)}
        onCreated={id => setSelectedId(id)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="card-elegant p-8 text-center space-y-3">
        <p className="text-sm text-destructive">{error.message}</p>
        <p className="text-xs text-muted-foreground">
          Se a mensagem falar de tabelas ausentes, aplique <code>supabase/migration_movimento_etapa1.sql</code> no SQL
          Editor do Supabase.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Marcas e produtos</h2>
          <p className="text-sm text-muted-foreground">
            Crie, edite, publique e arquive. Rascunhos não aparecem publicamente. Arquivar preserva o histórico.
          </p>
        </div>
        <Button className="btn-primary shrink-0" onClick={() => setSelectedId("new")}>
          <Plus className="h-4 w-4 mr-1" />
          Nova marca
        </Button>
      </div>

      {brands.length === 0 ? (
        <Card className="card-elegant p-10 text-center space-y-3">
          <p className="text-muted-foreground text-sm">
            Nenhuma marca cadastrada. Após aplicar a migração, rode também{" "}
            <code>supabase/seed_brands_initial.sql</code> para carregar Lizin e Xiclé como rascunhos editáveis.
          </p>
          <Button className="btn-primary" onClick={() => setSelectedId("new")}>
            Criar primeira marca
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {brands.map(b => (
            <Card
              key={b.id}
              className="card-elegant p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedId(b.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="h-12 w-12 rounded-xl border border-border overflow-hidden flex items-center justify-center shrink-0 bg-muted/40"
                  style={{ backgroundColor: b.logoUrl ? undefined : b.accentColor ?? undefined }}
                >
                  {b.logoUrl ? (
                    <img src={b.logoUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <span className="font-bold text-white">{b.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{b.name}</p>
                    <StatusBadge status={b.status as BrandStatus} kind="brand" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    /marcas/{b.slug}
                    {b.communicationConcept ? ` · ${b.communicationConcept}` : ""}
                    {` · ${b.productCount} produto(s), ${b.publishedProductCount} publicado(s)`}
                  </p>
                </div>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(b.id)}>
                Gerenciar
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
