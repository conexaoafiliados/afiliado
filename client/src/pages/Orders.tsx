import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, ShoppingBag, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function Orders() {
  const { user } = useAuth();
  const { data: orders, isLoading, error } = trpc.orders.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center border-red-200 bg-red-50">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar pedidos</h2>
            <p className="text-red-700">Tente novamente mais tarde</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Meus Pedidos</h1>
          <p className="text-slate-600">Histórico de compras e transações</p>
        </div>

        {!orders || orders.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Nenhum pedido realizado</h2>
            <p className="text-slate-600">Comece a explorar nossos produtos e cursos!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">
                        {order.productTitle}
                      </h3>
                      <Badge
                        variant={order.status === "paid" ? "default" : "secondary"}
                        className={
                          order.status === "paid"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : order.status === "shipped"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                              : order.status === "delivered"
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                        }
                      >
                        {order.status === "paid" ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {order.status === "paid"
                          ? "Pago"
                          : order.status === "shipped"
                            ? "Enviado"
                            : order.status === "delivered"
                              ? "Entregue"
                              : "Pendente"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-slate-600 flex items-center gap-1 mb-1">
                          <DollarSign className="w-4 h-4" />
                          Valor
                        </p>
                        <p className="font-semibold text-slate-900">
                          R$ {parseFloat(order.totalPrice).toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-600 mb-1">Quantidade</p>
                        <p className="font-semibold text-slate-900">{order.quantity}x</p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-600 flex items-center gap-1 mb-1">
                          <Calendar className="w-4 h-4" />
                          Data
                        </p>
                        <p className="font-semibold text-slate-900">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-600 mb-1">Categoria</p>
                        <p className="font-semibold text-slate-900 capitalize">{order.productCategory}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
