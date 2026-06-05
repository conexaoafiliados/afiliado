import { PunishmentImportantNote, PunishmentTypeSection } from "@/components/PunishmentGuideSections";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { PUNISHMENT_INTRO, PUNISHMENT_TYPES } from "@shared/punishments/content";
import { Link } from "wouter";

export default function PunishmentGuide() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/acessos/punicoes">
        <a className="text-sm text-muted-foreground hover:text-accent transition-colors inline-flex items-center gap-1">
          ← Voltar para Punições
        </a>
      </Link>

      <Card className="card-elegant space-y-6">
        <div className="space-y-4">
          <h1 className="text-xl font-bold uppercase tracking-tight leading-snug">
            {PUNISHMENT_INTRO.title}
          </h1>

          <div className="flex items-start gap-3">
            <UserAvatar name={PUNISHMENT_INTRO.authorName} size={44} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{PUNISHMENT_INTRO.authorName}</span>
                <Badge className="bg-primary/10 text-primary border-0">Equipe</Badge>
                <Badge className="bg-muted text-muted-foreground border-0">Administrador</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">18 de fev.</p>
            </div>
          </div>

          <div className="text-sm leading-relaxed text-foreground/90 space-y-3">
            <p>
              O TikTok Shop está aplicando uma onda de punições automáticas devido ao reforço na moderação de
              conteúdos e respeito às Diretrizes da plataforma.
            </p>
            <p>
              Diversos creators estão sendo penalizados mesmo quando o produto e o conteúdo estão corretos.
            </p>
            <p>Segue as punições mais comuns e como fazer a defesa para recorrer.</p>
          </div>
        </div>

        <div className="space-y-2">
          {PUNISHMENT_TYPES.map(type => (
            <PunishmentTypeSection key={type.id} type={type} />
          ))}
        </div>

        <PunishmentImportantNote />
      </Card>
    </div>
  );
}
