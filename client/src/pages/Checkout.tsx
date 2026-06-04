import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, ShoppingCart, CheckCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const createCheckout = trpc.payments.createCheckout.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage("Redirecionando para checkout...");
      // Redirecionar para Stripe Checkout
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message || "Erro ao criar sessão de checkout");
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      setStatus("success");
      setMessage("Pagamento realizado com sucesso! Obrigado pela compra.");
    } else if (params.get("canceled")) {
      setStatus("error");
      setMessage("Pagamento cancelado.");
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Autenticação Necessária</h2>
          <p className="text-slate-600 mb-6">Você precisa fazer login para acessar o checkout.</p>
          <Button onClick={() => setLocation("/")} className="w-full">
            Voltar ao Início
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Checkout</h1>
          <p className="text-slate-600">Complete sua compra de forma segura com Stripe</p>
        </div>

        <div className="grid gap-6">
          {/* Produtos Disponíveis */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Produtos Disponíveis
            </h2>

            <div className="space-y-3">
              <button
                onClick={() =>
                  createCheckout.mutate({
                    productType: "course",
                    productId: 1,
                    quantity: 1,
                  })
                }
                disabled={createCheckout.isPending}
                className="w-full p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">Premium Course Bundle</h3>
                    <p className="text-sm text-slate-600">Acesso a todos os cursos premium</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">$99.00</span>
                </div>
              </button>

              <button
                onClick={() =>
                  createCheckout.mutate({
                    productType: "product",
                    productId: 2,
                    quantity: 1,
                  })
                }
                disabled={createCheckout.isPending}
                className="w-full p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">Creator Template Pack</h3>
                    <p className="text-sm text-slate-600">20 templates prontos para usar</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">$29.00</span>
                </div>
              </button>

              <button
                onClick={() =>
                  createCheckout.mutate({
                    productType: "product",
                    productId: 3,
                    quantity: 1,
                  })
                }
                disabled={createCheckout.isPending}
                className="w-full p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">2K Followers Growth Guide</h3>
                    <p className="text-sm text-slate-600">Guia completo para crescer em 90 dias</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">$49.00</span>
                </div>
              </button>
            </div>
          </Card>

          {/* Status */}
          {status !== "idle" && (
            <Card
              className={`p-6 flex items-start gap-4 ${
                status === "success"
                  ? "bg-green-50 border-green-200"
                  : status === "error"
                    ? "bg-red-50 border-red-200"
                    : "bg-blue-50 border-blue-200"
              }`}
            >
              {status === "loading" && <Loader2 className="w-5 h-5 animate-spin text-blue-600 mt-0.5" />}
              {status === "success" && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
              {status === "error" && <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />}
              <div>
                <p
                  className={`font-semibold ${
                    status === "success"
                      ? "text-green-900"
                      : status === "error"
                        ? "text-red-900"
                        : "text-blue-900"
                  }`}
                >
                  {message}
                </p>
              </div>
            </Card>
          )}

          {/* Informações de Segurança */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-slate-900 mb-2">🔒 Pagamento Seguro</h3>
            <p className="text-sm text-slate-600">
              Todos os pagamentos são processados com segurança através do Stripe. Seus dados de cartão nunca são
              armazenados em nossos servidores.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
