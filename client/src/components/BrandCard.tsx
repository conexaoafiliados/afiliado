import { readableTextColor } from "@shared/brands";
import { Link } from "wouter";

export type BrandCardData = {
  id: number;
  slug: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  communicationConcept: string | null;
  accentColor: string | null;
  productCount?: number;
};

export function BrandAvatar({ brand, size = 56 }: { brand: Pick<BrandCardData, "name" | "logoUrl" | "accentColor">; size?: number }) {
  const bg = brand.accentColor ?? "var(--accent)";
  const fg = brand.accentColor ? readableTextColor(brand.accentColor) : "#ffffff";
  return (
    <div
      className="shrink-0 overflow-hidden rounded-xl border border-border bg-card flex items-center justify-center font-bold"
      style={{ width: size, height: size, backgroundColor: brand.logoUrl ? undefined : bg, color: fg }}
    >
      {brand.logoUrl ? (
        <img src={brand.logoUrl} alt={`Logo ${brand.name}`} className="h-full w-full object-contain" />
      ) : (
        <span style={{ fontSize: size * 0.4 }}>{brand.name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

export function BrandCard({ brand }: { brand: BrandCardData }) {
  const accent = brand.accentColor ?? "var(--accent)";
  return (
    <Link href={`/marcas/${brand.slug}`}>
      <a className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="relative h-24 w-full overflow-hidden" style={{ backgroundColor: accent }} aria-hidden>
          {brand.coverUrl && <img src={brand.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
        </div>
        <div className="-mt-7 px-4 pb-4">
          <BrandAvatar brand={brand} />
          <h3 className="mt-2 text-lg font-semibold leading-tight">{brand.name}</h3>
          {brand.communicationConcept && (
            <p className="text-sm font-medium" style={{ color: brand.accentColor ?? undefined }}>
              {brand.communicationConcept}
            </p>
          )}
          {brand.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{brand.description}</p>
          )}
          {typeof brand.productCount === "number" && (
            <p className="mt-2 text-xs text-muted-foreground">
              {brand.productCount === 0
                ? "Nenhum produto publicado ainda"
                : `${brand.productCount} ${brand.productCount === 1 ? "produto" : "produtos"}`}
            </p>
          )}
        </div>
      </a>
    </Link>
  );
}
