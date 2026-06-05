import type { VercelRequest, VercelResponse } from "@vercel/node";
import { nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";
import { createContext } from "../server/_core/context";
import { appRouter } from "../server/routers";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await nodeHTTPRequestHandler({
    req,
    res,
    path: "/api/trpc",
    router: appRouter,
    createContext,
  });
}
