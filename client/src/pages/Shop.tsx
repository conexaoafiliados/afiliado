import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductCard } from "@/components/ProductCard";
import { useState } from "react";

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: "digital" | "physical" | "service";
  sales: number;
  rating: number;
  inStock: boolean;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    title: "Guia Completo de Conteúdo",
    description: "E-book com 50 ideias de conteúdo para redes sociais",
    price: 29.90,
    category: "digital",
    sales: 234,
    rating: 4.8,
    inStock: true,
  },
  {
    id: 2,
    title: "Template de Roteiro",
    description: "Templates prontos para criar roteiros de vídeos",
    price: 19.90,
    category: "digital",
    sales: 156,
    rating: 4.7,
    inStock: true,
  },
  {
    id: 3,
    title: "Consultoria 1:1",
    description: "Sessão de consultoria personalizada de 1 hora",
    price: 99.90,
    category: "service",
    sales: 45,
    rating: 5.0,
    inStock: true,
  },
  {
    id: 4,
    title: "Camiseta Exclusiva",
    description: "Camiseta com logo da marca",
    price: 79.90,
    category: "physical",
    sales: 89,
    rating: 4.6,
    inStock: true,
  },
  {
    id: 5,
    title: "Pacote de Presets",
    description: "100 presets de edição para Lightroom",
    price: 49.90,
    category: "digital",
    sales: 312,
    rating: 4.9,
    inStock: true,
  },
  {
    id: 6,
    title: "Aula ao Vivo",
    description: "Aula ao vivo sobre estratégia de crescimento",
    price: 39.90,
    category: "service",
    sales: 67,
    rating: 4.8,
    inStock: false,
  },
];

export default function Shop() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [filter, setFilter] = useState<"all" | "digital" | "physical" | "service">("all");

  const filteredProducts = products.filter(product => {
    if (filter === "all") return true;
    return product.category === filter;
  });

  const handleBuy = (id: number) => {
    console.log("Comprando produto", id);
  };

  const handleShare = (id: number) => {
    console.log("Compartilhando produto", id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Loja</h1>
        <p className="text-muted-foreground">Venda seus produtos, serviços e conteúdo digital</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "digital", "physical", "service"].map(cat => (
          <Button
            key={cat}
            variant={filter === cat ? "default" : "outline"}
            onClick={() => setFilter(cat as any)}
            className={filter === cat ? "btn-primary" : ""}
          >
            {cat === "all" && "Todos"}
            {cat === "digital" && "Digitais"}
            {cat === "physical" && "Físicos"}
            {cat === "service" && "Serviços"}
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            {...product}
            onBuy={handleBuy}
            onShare={handleShare}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="card-elegant text-center py-12">
          <p className="text-muted-foreground mb-4">Nenhum produto encontrado nesta categoria</p>
          <Button variant="outline" onClick={() => setFilter("all")}>
            Ver todos os produtos
          </Button>
        </Card>
      )}
    </div>
  );
}
