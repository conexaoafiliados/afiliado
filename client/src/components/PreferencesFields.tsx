import { cn } from "@/lib/utils";
import { INTEREST_KEYS, INTEREST_LABELS, type InterestKey } from "@shared/brands";
import { Check } from "lucide-react";

export type PickableBrand = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  accentColor: string | null;
};

type Props = {
  interests: InterestKey[];
  brandIds: number[];
  brands: PickableBrand[];
  onInterestsChange: (next: InterestKey[]) => void;
  onBrandIdsChange: (next: number[]) => void;
  disabled?: boolean;
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

/** Campos controlados de interesses e marcas de interesse (tudo opcional). */
export function PreferencesFields({
  interests,
  brandIds,
  brands,
  onInterestsChange,
  onBrandIdsChange,
  disabled,
}: Props) {
  return (
    <div className="space-y-5">
      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-sm font-medium">O que você quer fazer aqui?</legend>
        <p className="text-xs text-muted-foreground">
          Escolha quantos quiser e mude quando quiser. Isso só personaliza sua experiência.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {INTEREST_KEYS.map(key => {
            const selected = interests.includes(key);
            const meta = INTEREST_LABELS[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => onInterestsChange(toggle(interests, key))}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-60",
                  selected ? "border-accent bg-accent/10" : "border-border hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                    selected ? "border-accent bg-accent text-accent-foreground" : "border-border"
                  )}
                >
                  {selected && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{meta.label}</span>
                  <span className="block text-xs text-muted-foreground">{meta.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {brands.length > 0 && (
        <fieldset className="space-y-2" disabled={disabled}>
          <legend className="text-sm font-medium">Marcas que despertam seu interesse</legend>
          <p className="text-xs text-muted-foreground">
            Opcional. Não é uma adesão: você continua no mesmo movimento, com a mesma conta.
          </p>
          <div className="flex flex-wrap gap-2">
            {brands.map(brand => {
              const selected = brandIds.includes(brand.id);
              return (
                <button
                  key={brand.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onBrandIdsChange(toggle(brandIds, brand.id))}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-60",
                    selected ? "border-accent bg-accent/10 font-medium" : "border-border hover:bg-muted/50"
                  )}
                >
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: brand.accentColor ?? "var(--accent)" }}
                    />
                  )}
                  {brand.name}
                  {selected && <Check className="h-3.5 w-3.5 text-accent" />}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
