import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { IncomingMessage } from "http";
import { createContext } from "../_bundle/server/_core/context";
import { appRouter } from "../_bundle/server/routers";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: IncomingMessage, limit = 4 * 1024 * 1024): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > limit) throw new Error("Body too large");
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

/** Atende /api/trpc/auth.register, /api/trpc/auth.login, etc. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const protocol = (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
    const host = req.headers.host ?? "localhost";
    const url = `${protocol}://${host}${req.url ?? "/api/trpc"}`;

    const bodyBuffer =
      req.method !== "GET" && req.method !== "HEAD" ? await readRawBody(req) : undefined;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
    }

    const webRequest = new Request(url, {
      method: req.method,
      headers,
      body: bodyBuffer?.length ? bodyBuffer : undefined,
    });

    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: webRequest,
      router: appRouter,
      createContext: ({ req: fetchReq }) => {
        const headerRecord: Record<string, string | string[] | undefined> = {};
        fetchReq.headers.forEach((value, key) => {
          headerRecord[key] = value;
        });
        return createContext({ req: { headers: headerRecord }, res: {} });
      },
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "transfer-encoding") return;
      res.setHeader(key, value);
    });
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error("[tRPC handler]", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          message: error instanceof Error ? error.message : "Erro interno do servidor",
        },
      });
    }
  }
}
