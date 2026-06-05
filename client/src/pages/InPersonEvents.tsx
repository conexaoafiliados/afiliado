import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Users } from "lucide-react";
import { Link } from "wouter";

export default function InPersonEvents() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <span className="text-2xl">🚐</span> Eventos Presenciais
      </h1>

      <Card className="card-elegant p-8 sm:p-10 text-center space-y-4">
        <span className="inline-block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Em breve
        </span>

        <h2 className="text-xl sm:text-2xl font-semibold">
          Encontros presenciais da comunidade
        </h2>

        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Estamos organizando eventos ao vivo com networking e aprendizado. A agenda será
          publicada em breve nos avisos oficiais.
        </p>

        <div className="flex flex-wrap justify-center gap-5 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            Cidades selecionadas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            Comunidade creator
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            Agenda em breve
          </span>
        </div>
      </Card>

      <Card className="card-elegant p-6 text-center space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed max-w-lg mx-auto">
          Enquanto isso, acompanhe os avisos oficiais e os treinamentos ao vivo.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/acessos/avisos">
            <a>
              <Button variant="outline" size="sm">
                Ver avisos
              </Button>
            </a>
          </Link>
          <Link href="/acessos/treinamentos">
            <a>
              <Button className="btn-primary" size="sm">
                Treinamentos ao vivo
              </Button>
            </a>
          </Link>
        </div>
      </Card>
    </div>
  );
}
