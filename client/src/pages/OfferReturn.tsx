import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function OfferReturn() {
  const params = new URLSearchParams(window.location.search);
  const orderNsu = params.get("order_nsu") ?? "";
  const transactionNsu = params.get("transaction_nsu") ?? "";
  const slug = params.get("slug") ?? "";
  const confirm = trpc.affiliateProgram.confirmReturn.useMutation();
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started || !orderNsu || !transactionNsu || !slug) return;
    setStarted(true);
    confirm.mutate({ orderNsu, transactionNsu, slug });
  }, [started, orderNsu, transactionNsu, slug, confirm]);

  const paid = confirm.data?.paid;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-3 p-8 text-center">
      {confirm.isPending || (!confirm.data && orderNsu) ? <Loader2 className="h-8 w-8 animate-spin" /> : null}
      <h1 className="text-2xl font-semibold">
        {paid ? "Pagamento confirmado" : confirm.isError ? "Não foi possível confirmar" : "Pagamento recebido"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {paid
          ? "A compra foi registrada e a comissão fica com a afiliada do link."
          : "A InfinitePay ainda não confirmou este pagamento. Se o valor foi debitado, a confirmação chega pelo webhook."}
      </p>
      <Link href="/" className="text-sm underline">
        Voltar ao início
      </Link>
    </main>
  );
}
