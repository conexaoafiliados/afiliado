import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Megaphone } from "lucide-react";
import { Link } from "wouter";

/**
 * Etapa 1: ainda não existem campanhas cadastradas, então a página mostra apenas um estado vazio
 * verdadeiro. A listagem real (filtros por marca/produto, candidatura) entra na etapa 2.
 */
export default function Campaigns() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Megaphone className="h-7 w-7 text-accent" /> Campanhas
        </h1>
        <p className="text-muted-foreground mt-1">Oportunidades publicadas pelas marcas do movimento.</p>
      </div>

      <Card className="p-8 text-center space-y-3">
        <p className="font-medium">Nenhuma campanha aberta no momento</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Cada campanha terá seus próprios critérios, prazos e condições, informados antes da candidatura. Enquanto
          isso, conheça as marcas e acompanhe os avisos da comunidade.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Link href="/marcas">
            <a>
              <Button className="btn-primary" size="sm">
                Conhecer marcas e produtos
              </Button>
            </a>
          </Link>
          <Link href="/acessos/avisos">
            <a>
              <Button variant="outline" size="sm">
                Ver avisos
              </Button>
            </a>
          </Link>
        </div>
      </Card>
    </div>
  );
}
