import { ENV } from "./env";

const LINKS = "https://api.checkout.infinitepay.io/links";
const CHECK = "https://api.checkout.infinitepay.io/payment_check";

export function isInfinitePayConfigured() {
  return Boolean(ENV.infinitePayHandle);
}

type LinkItem = { quantity: number; price: number; description: string };

export async function createInfinitePayLink(input: {
  orderNsu: string;
  description: string;
  priceCents: number;
  redirectUrl: string;
  webhookUrl: string;
}) {
  if (!ENV.infinitePayHandle) {
    throw new Error("Configure INFINITEPAY_HANDLE no servidor (InfiniteTag, sem o $).");
  }
  const payload: Record<string, unknown> = {
    handle: ENV.infinitePayHandle,
    order_nsu: input.orderNsu,
    redirect_url: input.redirectUrl,
    webhook: { url: input.webhookUrl, events: ["paid", "canceled", "refunded"] },
    items: [{ quantity: 1, price: input.priceCents, description: input.description } satisfies LinkItem],
  };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (ENV.infinitePayApiKey) headers["X-Api-Key"] = ENV.infinitePayApiKey;

  const res = await fetch(LINKS, { method: "POST", headers, body: JSON.stringify(payload) });
  const json = (await res.json().catch(() => ({}))) as {
    url?: string;
    link?: string;
    checkout_url?: string;
    message?: string;
    error?: string;
  };
  const url = json.url || json.link || json.checkout_url;
  if (!res.ok || !url) {
    throw new Error(json.message || json.error || "A InfinitePay não gerou o link de pagamento.");
  }
  return url;
}

export async function checkInfinitePayPayment(input: {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
}) {
  if (!ENV.infinitePayHandle) return { paid: false as const, captureMethod: null, paidAmount: null };
  const res = await fetch(CHECK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: ENV.infinitePayHandle,
      order_nsu: input.orderNsu,
      transaction_nsu: input.transactionNsu,
      slug: input.slug,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    paid?: boolean;
    capture_method?: string;
    paid_amount?: number;
  };
  return {
    paid: Boolean(json.paid),
    captureMethod: json.capture_method ?? null,
    paidAmount: json.paid_amount ?? null,
  };
}
