import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod";
import { APP_NAME } from "../const";
import { protectedProcedure, router } from "../_core/trpc";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export const paymentsRouter = router({
  createCheckout: protectedProcedure
    .input(
      z.object({
        productType: z.enum(["course", "product", "subscription"]),
        productId: z.number(),
        quantity: z.number().default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      if (!stripe) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe não configurado" });
      }
      const origin = ctx.req.headers.origin || process.env.APP_URL || "http://localhost:3000";
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: `${APP_NAME} — Produto #${input.productId}`,
                description: `${input.productType}`,
              },
              unit_amount: 2999,
            },
            quantity: input.quantity,
          },
        ],
        mode: "payment",
        success_url: `${origin}/shop/browse?success=true`,
        cancel_url: `${origin}/shop/browse?canceled=true`,
        customer_email: ctx.user.email || undefined,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          product_id: input.productId.toString(),
          product_type: input.productType,
        },
      });
      if (!session.url) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao criar checkout" });
      }
      return { url: session.url, sessionId: session.id };
    }),
});
