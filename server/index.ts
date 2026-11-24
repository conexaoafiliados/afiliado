import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./_core/context";
import { appRouter } from "./routers";
import { checkInfinitePayPayment } from "./_core/infinitepay";
import { confirmAffiliateOrder } from "./affiliateProgramDb";
import { handleStripeWebhook } from "./stripe-webhook";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => server.close(() => resolve(true)));
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.post("/api/infinitepay/webhook", async (req, res) => {
    const body = (req.body ?? {}) as {
      order_nsu?: string;
      transaction_nsu?: string;
      invoice_slug?: string;
      slug?: string;
      capture_method?: string;
    };
    const orderNsu = body.order_nsu;
    const transactionNsu = body.transaction_nsu;
    const slug = body.invoice_slug || body.slug;
    if (!orderNsu || !transactionNsu || !slug) {
      res.status(400).json({ ok: false });
      return;
    }
    try {
      const check = await checkInfinitePayPayment({ orderNsu, transactionNsu, slug });
      await confirmAffiliateOrder({
        orderNsu,
        transactionNsu,
        invoiceSlug: slug,
        captureMethod: check.captureMethod ?? body.capture_method ?? null,
        paid: check.paid,
      });
      res.status(200).json({ ok: true });
    } catch (error) {
      console.warn("[InfinitePay webhook]", error);
      res.status(400).json({ ok: false });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);
  server.listen(port, () => {
    console.log(`Conexões Creator — http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
