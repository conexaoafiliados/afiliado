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

/** Fundo suave a partir da cor de destaque (para área da logo). */
function softTint(hex: string | null | undefined, alpha = 0.12): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return "var(--muted)";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function BrandAvatar({
  brand,
  size = 56,
}: {
  brand: Pick<BrandCardData, "name" | "logoUrl" | "accentColor">;
  size?: number;
}) {
  const bg = brand.accentColor ?? "var(--accent)";
  const fg = brand.accentColor ? readableTextColor(brand.accentColor) : "#ffffff";
  return (
    <div
      className="shrink-0 overflow-hidden rounded-xl border border-border bg-card flex items-center justify-center font-bold p-1.5"
      style={{
        width: size,
        height: size,
        backgroundColor: brand.logoUrl ? softTint(brand.accentColor, 0.08) : bg,
        color: fg,
      }}
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
      <a className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-[box-shadow,transform] duration-200 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {/* Faixa de destaque fina — não compete com a logo */}
        <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: accent }} aria-hidden />

        {/* Área da logo: espaço generoso, fundo suave, logo completa */}
        <div
          className="relative flex h-28 sm:h-32 items-center justify-center px-6 py-5"
          style={{
            background: brand.coverUrl
              ? undefined
              : `linear-gradient(180deg, ${softTint(brand.accentColor, 0.18)} 0%, ${softTint(brand.accentColor, 0.05)} 100%)`,
          }}
        >
          {brand.coverUrl && (
            <img src={brand.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" loading="lazy" />
          )}
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={`Logo ${brand.name}`}
              className="relative z-[1] max-h-16 sm:max-h-20 w-full max-w-[200px] object-contain drop-shadow-sm"
              loading="lazy"
            />
          ) : (
            <div
              className="relative z-[1] flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold shadow-sm"
              style={{ backgroundColor: accent, color: readableTextColor(brand.accentColor) }}
            >
              {brand.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-3 border-t border-border/60">
          <h3 className="text-lg font-semibold leading-tight tracking-tight">{brand.name}</h3>
          {brand.communicationConcept && (
            <p className="text-sm font-medium leading-snug" style={{ color: accent }}>
              {brand.communicationConcept}
            </p>
          )}
          {brand.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">{brand.description}</p>
          )}
          {typeof brand.productCount === "number" && (
            <p className="mt-auto pt-2 text-xs text-muted-foreground">
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
