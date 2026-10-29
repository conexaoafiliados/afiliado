/**
 * Regras compartilhadas (cliente + servidor) de marcas, produtos, ofertas e interesses.
 * Mantém validações em um único lugar para não depender só da interface.
 */

export const BRAND_STATUSES = ["draft", "published", "archived"] as const;
export type BrandStatus = (typeof BRAND_STATUSES)[number];

export const BRAND_STATUS_LABELS: Record<BrandStatus, string> = {
  draft: "Rascunho",
  published: "Publicada",
  archived: "Arquivada",
};

export const PRODUCT_STATUS_LABELS: Record<BrandStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

/** Interesses do creator. Não concedem permissões nem aprovação de afiliado/embaixador. */
export const INTEREST_KEYS = ["learn", "create_content", "refer", "sell"] as const;
export type InterestKey = (typeof INTEREST_KEYS)[number];

export const INTEREST_LABELS: Record<InterestKey, { label: string; description: string }> = {
  learn: { label: "Aprender", description: "Trilhas, aulas e materiais para evoluir." },
  create_content: { label: "Criar conteúdo", description: "Produzir vídeos, fotos e posts." },
  refer: { label: "Indicar", description: "Recomendar produtos e marcas para outras pessoas." },
  sell: { label: "Vender", description: "Desenvolver vendas em canais oficiais." },
};

/** Canais de oferta. "outro" permite cadastrar canais novos sem alterar código. */
export const OFFER_CHANNELS = [
  "tiktok_shop",
  "site_oficial",
  "marketplace",
  "loja_fisica",
  "whatsapp",
  "outro",
] as const;
export type OfferChannel = (typeof OFFER_CHANNELS)[number];

export const OFFER_CHANNEL_LABELS: Record<OfferChannel, string> = {
  tiktok_shop: "TikTok Shop",
  site_oficial: "Site oficial",
  marketplace: "Marketplace",
  loja_fisica: "Loja física",
  whatsapp: "WhatsApp",
  outro: "Outro canal",
};

export const SLUG_MIN = 2;
export const SLUG_MAX = 80;
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ACCENT_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

/** Slugs que colidiriam com rotas fixas em /marcas/:slug. */
export const RESERVED_SLUGS = new Set(["novo", "nova", "admin", "api"]);

export const SLUG_HINT = "Use letras minúsculas, números e hífens — ex: minha-marca";

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return (
    slug.length >= SLUG_MIN &&
    slug.length <= SLUG_MAX &&
    SLUG_REGEX.test(slug) &&
    !RESERVED_SLUGS.has(slug)
  );
}

/** Aceita somente http(s). Bloqueia javascript:, data: e similares. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export type ReferenceMaterial = { label: string; url: string };

export type BrandPublishInput = {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
};

/** Retorna os motivos pelos quais a marca ainda não pode ser publicada. */
export function getBrandPublishIssues(brand: BrandPublishInput): string[] {
  const issues: string[] = [];
  if (!brand.name?.trim()) issues.push("Informe o nome da marca.");
  if (!brand.slug?.trim() || !isValidSlug(brand.slug)) issues.push("Informe um identificador de URL válido.");
  if (!brand.description?.trim()) issues.push("Escreva a descrição da marca antes de publicar.");
  return issues;
}

export type ProductPublishInput = {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
};

export function getProductPublishIssues(product: ProductPublishInput): string[] {
  const issues: string[] = [];
  if (!product.name?.trim()) issues.push("Informe o nome do produto.");
  if (!product.slug?.trim() || !isValidSlug(product.slug)) issues.push("Informe um identificador de URL válido.");
  if (!product.description?.trim()) issues.push("Escreva a descrição do produto antes de publicar.");
  return issues;
}

/**
 * Transições de status permitidas. Arquivar preserva o registro (campanhas, pedidos e
 * participações anteriores continuam referenciando o item); restaurar volta para rascunho.
 */
export function canTransitionStatus(from: BrandStatus, to: BrandStatus): boolean {
  if (from === to) return false;
  if (from === "archived") return to === "draft";
  return true;
}

/** Cor de texto legível sobre uma cor de destaque (WCAG simplificado). */
export function readableTextColor(hex: string | null | undefined): "#ffffff" | "#111827" {
  if (!hex || !ACCENT_COLOR_REGEX.test(hex)) return "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.45 ? "#111827" : "#ffffff";
}
