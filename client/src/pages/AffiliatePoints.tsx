import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { pointsRegulation } from "@shared/affiliateProgram";
import { Star } from "lucide-react";
import { useState } from "react";

export default function AffiliatePoints() {
  const { data } = trpc.affiliateProgram.points.useQuery();
  const [open, setOpen] = useState(true);
  const rules = data?.rules;
  const text = pointsRegulation(data?.mentionHandle, rules);
  const month = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const balance = data?.balance ?? { points: 0, sales: 0, stories: 0, feed: 0, reels: 0 };

  const rows = [
    ["Stories com marcação", balance.stories, rules?.storyPoints ?? 0],
    ["Fotos e carrosséis", balance.feed, rules?.feedPoints ?? 0],
    ["Reels e vídeos", balance.reels, rules?.reelPoints ?? 0],
    ["Vendas aprovadas", balance.sales, rules?.salePoints ?? 0],
  ] as const;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Meus pontos</h1>
        <p className="capitalize text-muted-foreground">Programa de pontos · {month}</p>
      </div>
      {data?.message && <Card className="p-4 text-sm">{data.message}</Card>}

      <Card className="bg-accent p-5 text-accent-foreground">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/40 text-2xl font-bold">
            {balance.points}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs tracking-wide text-accent-foreground/80">ESTE MÊS</p>
            <p className="text-xl font-semibold">{balance.sales} vendas</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/20">
              <div className="h-full w-0 bg-white" />
            </div>
            <p className="mt-2 text-xs text-accent-foreground/80">
              A contagem abre quando as menções a {text.mention} e as vendas aprovadas passarem a entrar no portal.
            </p>
          </div>
          <p className="text-sm">{balance.sales}/{rules?.redeemMinSales ?? 5} vendas</p>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold">Como você pontuou</h2>
        <ul className="mt-2 divide-y divide-border">
          {rows.map(([label, count, each]) => (
            <li key={label} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-muted-foreground">{count} × {each} pontos</p>
              </div>
              <span className="font-semibold">{count * each}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold">Produtos para trocar</h2>
        {(data?.products.length ?? 0) === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum produto com pontos ainda. A equipe define o valor de cada um no admin.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {data?.products.map(product => (
              <li key={product.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {product.name}
                  <span className="text-muted-foreground"> · {product.brandName}</span>
                </span>
                <span className="font-semibold">{product.pointsCost} pts</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold">Mês</h2>
        <div className="mt-3 flex items-center justify-between text-sm">
          <div>
            <p className="capitalize font-medium">{month}</p>
            <p className="text-muted-foreground">em andamento</p>
          </div>
          <span>{balance.points} pontos · {balance.sales} vendas</span>
        </div>
      </Card>

      <Card className="p-4">
        <button type="button" className="flex w-full items-center justify-between" onClick={() => setOpen(value => !value)}>
          <span className="flex items-center gap-2 font-semibold">
            <Star className="h-4 w-4" /> Regulamento
          </span>
          <span className="text-muted-foreground">{open ? "–" : "+"}</span>
        </button>
        {open && (
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Pontuação por ações realizadas</p>
            {text.actions.map(line => (
              <p key={line}>{line}</p>
            ))}
            <p>{text.monthly}</p>
            <p className="font-medium text-foreground">Critérios para trocar por produtos</p>
            {text.criteria.map(line => (
              <p key={line}>{line}</p>
            ))}
            <p className="font-medium text-foreground">Troca de produtos</p>
            <p>{text.redeem}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
