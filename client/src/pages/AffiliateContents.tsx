import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function AffiliateContents() {
  const { data } = trpc.instagram.status.useQuery();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Meus conteúdos</h1>
        <p className="text-muted-foreground">
          Stories, posts e reels em que você marca o @ da marca. Eles só aparecem depois que a menção chega da
          Meta.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Conteúdos", "0"],
          ["Stories", "0"],
          ["Vídeos e reels", "0"],
          ["Posts", "0"],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="space-y-3 p-5 text-sm leading-relaxed">
        <p>
          A conexão de Instagram que o app já tem lê perfil, seguidores, curtidas, views e comentários de uma conta
          profissional. {data?.linked ? `A conta @${(data.handle ?? "").replace(/^@/, "")} está conectada.` : "Nenhuma conta está conectada agora."}{" "}
          Ela não pede a lista de publicações nem o que marcou a marca.
        </p>
        <p>
          Para esta aba funcionar como na referência, a conta da marca (também profissional, ligada a uma Página) precisa
          autorizar o app a ler menções. Quando alguém marca esse @, a Meta avisa o portal. Story some em 24 horas, então
          o arquivo tem que ser guardado na hora. Conta pessoal não entra nessa API.
        </p>
        <p>
          Enquanto isso, o @ que vale a marcação é o da marca da missão. Os pontos dessas publicações
          continuam em zero.
        </p>
        <Link href="/growth/progress">
          <a>
            <Button type="button" variant="outline">
              {data?.linked ? "Ver conexão do Instagram" : "Conectar Instagram"}
            </Button>
          </a>
        </Link>
      </Card>
    </div>
  );
}
