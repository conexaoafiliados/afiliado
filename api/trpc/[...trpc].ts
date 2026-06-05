import type { VercelRequest, VercelResponse } from "@vercel/node";
import { nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";
import { createContext } from "../../server/_core/context";
import { appRouter } from "../../server/routers";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

/** Atende /api/trpc/auth.register, /api/trpc/auth.login, etc. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await nodeHTTPRequestHandler({
      req,
      res,
      path: "/api/trpc",
      router: appRouter,
      createContext,
    });
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
