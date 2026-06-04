import type { Request, Response } from "express";
import Stripe from "stripe";
import { productOrders } from "../drizzle/schema";
import { getDb } from "./db";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function handleStripeWebhook(req: Request, res: Response) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !webhookSecret) {
    return res.status(503).json({ error: "Stripe não configurado" });
  }
  const stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  if (event.id.startsWith("evt_test_")) {
    return res.json({ verified: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
    }
    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) return;

  const userId = parseInt(session.client_reference_id || "0", 10);
  const productId = parseInt(session.metadata?.product_id || "0", 10);
  if (!userId || !productId) return;

  await db.insert(productOrders).values({
    userId,
    productId,
    quantity: 1,
    totalPrice: ((session.amount_total || 0) / 100).toFixed(2),
    status: "paid",
  });
}
