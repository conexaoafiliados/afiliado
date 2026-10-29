import { BrandCard } from "@/components/BrandCard";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Store } from "lucide-react";

export default function Brands() {
  const { data: brands = [], isLoading } = trpc.brands.listPublished.useQuery();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Marcas e produtos</h1>
        <p className="text-muted-foreground mt-1">
          As marcas que fazem parte do movimento. Conheça cada uma, seus produtos e as campanhas disponíveis.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : brands.length === 0 ? (
        <Card className="p-10 text-center space-y-2">
          <Store className="h-9 w-9 mx-auto text-muted-foreground/60" />
          <p className="font-medium">Nenhuma marca publicada ainda</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Quando a equipe publicar as marcas participantes, elas aparecerão aqui.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map(brand => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}
