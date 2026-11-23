import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Target } from "lucide-react";
import { Link } from "wouter";

function formatRange(start: Date | string | null, end: Date | string | null) {
  const fmt = (value: Date | string | null) =>
    value ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "";
  const a = fmt(start);
  const b = fmt(end);
  if (a && b) return `${a} – ${b}`;
  if (a) return `desde ${a}`;
  if (b) return `até ${b}`;
  return "Sem prazo fixo";
}

export default function AffiliateChallenges() {
  const { data, isLoading } = trpc.affiliateProgram.challenges.useQuery();
  const list = data?.challenges ?? [];
  const active = list.filter(item => item.status === "active");
  const done = list.filter(item => item.status !== "active");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Desafios</h1>
        <p className="text-muted-foreground">Metas com prazo e recompensa. Bateu, levou.</p>
      </div>
      {data?.message && <Card className="p-4 text-sm">{data.message}</Card>}

      <section className="space-y-3">
        <h2 className="font-semibold">Em andamento</h2>
        {isLoading ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">Carregando…</Card>
        ) : active.length === 0 ? (
          <Card className="px-6 py-12 text-center">
            <Target className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 font-medium">Nenhum desafio ativo agora</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Quando a equipe publicar um, ele aparece aqui e na sua tela inicial.
            </p>
          </Card>
        ) : (
          active.map(item => (
            <Card key={item.id} className="p-4">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                Marcar @{item.instagramHandle.replace(/^@/, "")}
                {item.brandName ? ` · ${item.brandName}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{formatRange(item.startsAt, item.endsAt)}</p>
              {item.description && <p className="mt-2 text-sm">{item.description}</p>}
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Encerrados</h2>
        {done.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">Nenhum desafio encerrado.</Card>
        ) : (
          done.map(item => (
            <Card key={item.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{formatRange(item.startsAt, item.endsAt)}</p>
              </div>
              <span className="rounded-full border border-border px-2 py-1 text-xs">Encerrado</span>
            </Card>
          ))
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        As missões de crescimento do app continuam em{" "}
        <Link href="/growth/missions">
          <a className="text-accent hover:underline">Missões</a>
        </Link>
        . Estes desafios são só os que a equipe publica para o programa.
      </p>
    </div>
  );
}
