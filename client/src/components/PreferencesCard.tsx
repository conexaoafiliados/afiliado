import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PreferencesFields } from "@/components/PreferencesFields";
import { trpc } from "@/lib/trpc";
import type { InterestKey } from "@shared/brands";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/** Editor de interesses e marcas de interesse, com persistência no servidor. */
export function PreferencesCard({ id, title = "Seus interesses" }: { id?: string; title?: string }) {
  const utils = trpc.useUtils();
  const { data: prefs, isLoading } = trpc.movement.preferences.useQuery(undefined, { retry: false });
  const { data: brands = [] } = trpc.brands.listPublished.useQuery();

  const [interests, setInterests] = useState<InterestKey[]>([]);
  const [brandIds, setBrandIds] = useState<number[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (prefs && !dirty) {
      setInterests(prefs.interests);
      setBrandIds(prefs.brandIds);
    }
  }, [prefs, dirty]);

  const save = trpc.movement.savePreferences.useMutation({
    onSuccess: async () => {
      setDirty(false);
      await Promise.all([utils.movement.preferences.invalidate(), utils.movement.home.invalidate()]);
      toast.success("Preferências salvas");
    },
    onError: err => toast.error(err.message),
  });

  return (
    <Card id={id} className="p-5 space-y-4 scroll-mt-20">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {prefs?.savedAt ? null : (
          <p className="text-xs text-muted-foreground mt-1">Você ainda não escolheu. É opcional.</p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <PreferencesFields
            interests={interests}
            brandIds={brandIds}
            brands={brands}
            onInterestsChange={next => {
              setInterests(next);
              setDirty(true);
            }}
            onBrandIdsChange={next => {
              setBrandIds(next);
              setDirty(true);
            }}
            disabled={save.isPending}
          />
          <Button
            type="button"
            className="btn-primary"
            disabled={save.isPending || (!dirty && Boolean(prefs?.savedAt))}
            onClick={() => save.mutate({ interests, brandIds })}
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {prefs?.savedAt ? "Salvar alterações" : "Salvar preferências"}
          </Button>
        </>
      )}
    </Card>
  );
}
