import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Heart, Share2 } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  id: number;
  title: string;
  description: string;
  price: number;
  category: "digital" | "physical" | "service";
  sales: number;
  rating: number;
  inStock: boolean;
  onBuy?: (id: number) => void;
  onShare?: (id: number) => void;
}

export function ProductCard({
  id,
  title,
  description,
  price,
  category,
  sales,
  rating,
  inStock,
  onBuy,
  onShare,
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "digital":
        return "Digital";
      case "physical":
        return "Físico";
      case "service":
        return "Serviço";
      default:
        return cat;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "digital":
        return "bg-blue-100 text-blue-700";
      case "physical":
        return "bg-purple-100 text-purple-700";
      case "service":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="card-elegant hover-lift flex flex-col">
      <div className="mb-4">
        <div className="w-full h-40 bg-gradient-to-br from-accent/10 to-secondary/10 rounded-lg flex items-center justify-center mb-4 relative">
          <ShoppingBag className="w-16 h-16 text-accent opacity-20" />
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-all"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite
                  ? "fill-rose-500 text-rose-500"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
      </div>

      <div className="space-y-3 mb-4 flex-1">
        <div className="flex items-center justify-between">
          <Badge className={getCategoryColor(category)}>
            {getCategoryLabel(category)}
          </Badge>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">★ {rating}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-accent">
            R$ {price.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            {sales} vendas
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1 btn-primary"
          disabled={!inStock}
          onClick={() => onBuy && onBuy(id)}
        >
          {inStock ? "Comprar" : "Indisponível"}
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => onShare && onShare(id)}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
