import { Card } from "@/components/ui/card";
import { Link } from "wouter";

export default function AffiliateLives() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Lives</h1>
        <p className="text-muted-foreground">
          Na referência, a afiliada se inscreve na live da marca para o link dela contar as vendas daquele horário.
        </p>
      </div>
      <Card className="space-y-3 p-5 text-sm leading-relaxed">
        <p>
          A live não é um vídeo guardado no portal. É uma janela de tempo: a marca avisa o horário, a afiliada confirma
          presença e, se a loja da marca informar o pedido com o cupom ou o link, só as vendas dessa janela entram na meta
          da live.
        </p>
        <p>
          Isso só funciona com um aviso da loja (pedido, cupom e hora). Sem esse aviso, inscrever alguém na live não muda
          comissão nem ranking. Por isso esta lista ainda não mostra lives passadas.
        </p>
        <p>
          Encontros ao vivo de treinamento da Conexões já ficam em{" "}
          <Link href="/acessos/treinamentos">
            <a className="text-accent hover:underline">Treinamentos e Reuniões</a>
          </Link>
          . Essa aba é outra coisa: venda durante a transmissão da marca.
        </p>
      </Card>
      <Card className="p-8 text-center text-sm text-muted-foreground">Nenhuma live publicada.</Card>
    </div>
  );
}
