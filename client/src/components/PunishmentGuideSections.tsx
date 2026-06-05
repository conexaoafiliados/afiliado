import { Card } from "@/components/ui/card";
import type { PunishmentType } from "@shared/punishments/content";

export function PunishmentTypeSection({ type }: { type: PunishmentType }) {
  return (
    <section className="space-y-4 pt-6 border-t border-border first:border-t-0 first:pt-0">
      <div>
        <h2 className="text-base font-bold uppercase tracking-tight flex items-start gap-2">
          <span className="shrink-0">🚨</span>
          <span>
            {type.title}
            {type.subtitle && (
              <span className="block text-sm font-normal normal-case text-muted-foreground mt-1">
                ({type.subtitle})
              </span>
            )}
          </span>
        </h2>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-2">Por que acontece?</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/90">
          {type.reasons.map(reason => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <span>📝</span> Modelo de defesa:
        </h3>
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
          {type.defenseModel}
        </div>
      </div>
    </section>
  );
}

export function PunishmentImportantNote() {
  return (
    <Card className="card-elegant bg-amber-500/5 border-amber-500/20 space-y-3">
      <h3 className="font-bold text-sm flex items-center gap-2">
        <span>📌</span> IMPORTANTE:
      </h3>
      <p className="text-sm text-foreground/90">Essas punições são, em grande parte, automáticas.</p>
      <p className="text-sm font-bold text-foreground">Sempre peça REAVALIAÇÃO MANUAL.</p>
      <p className="text-sm text-foreground/90 leading-relaxed">
        Os textos de defesa acima são modelos base.{" "}
        <strong>Use como referência e adapte de acordo com a sua situação específica</strong>, evitando alterar
        demais a estrutura do texto.
      </p>
    </Card>
  );
}
