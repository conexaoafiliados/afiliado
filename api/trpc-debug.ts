import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { publicProcedure, router } from "../../server/_core/trpc";

const debugRouter = router({
  health: publicProcedure.query(() => ({
    ok: true,
    ts: new Date().toISOString(),
  })),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const protocol = (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
    const host = req.headers.host ?? "localhost";
    const url = `${protocol}://${host}${req.url ?? "/api/trpc-debug"}`;

    const webRequest = new Request(url, { method: req.method ?? "GET" });

    const response = await fetchRequestHandler({
      endpoint: "/api/trpc-debug",
      req: webRequest,
      router: debugRouter,
      createContext: () => Promise.resolve({ req: { headers: {} }, res: {}, user: null }),
    });

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
