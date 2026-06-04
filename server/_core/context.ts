import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId, upsertUser } from "../db";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function verifySupabaseToken(token: string): Promise<{ sub: string; email?: string; name?: string } | null> {
  if (!ENV.supabaseUrl) return null;
  try {
    const jwks = createRemoteJWKSet(
      new URL(`${ENV.supabaseUrl.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`)
    );
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${ENV.supabaseUrl.replace(/\/$/, "")}/auth/v1`,
    });
    return {
      sub: String(payload.sub),
      email: typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.user_metadata === "object" && payload.user_metadata && "full_name" in payload.user_metadata
        ? String((payload.user_metadata as Record<string, unknown>).full_name)
        : undefined,
    };
  } catch {
    return null;
  }
}

export async function createContext({ req, res }: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    const claims = await verifySupabaseToken(token);
    if (claims?.sub) {
      await upsertUser({
        openId: claims.sub,
        email: claims.email ?? null,
        name: claims.name ?? null,
        loginMethod: "supabase",
        lastSignedIn: new Date(),
      });
      user = (await getUserByOpenId(claims.sub)) ?? null;
    }
  }

  return { req, res, user };
}
