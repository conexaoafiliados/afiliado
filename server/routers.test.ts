import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "supabase",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: { origin: "http://localhost:3000" } } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("appRouter", () => {
  describe("auth", () => {
    it("retorna usuário autenticado em auth.me", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toEqual(ctx.user);
      expect(result?.openId).toBe("test-user-1");
    });

    it("logout retorna success", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();
      expect(result).toEqual({ success: true });
    });
  });

  describe("system", () => {
    it("health check ok", async () => {
      const caller = appRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
      const result = await caller.system.health();
      expect(result.ok).toBe(true);
      expect(result.app).toBe("Conexões Creator");
    });
  });

  describe("routers protegidos", () => {
    it("profile.get exige usuário", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      });
      await expect(caller.profile.get()).rejects.toThrow();
    });

    it("missions.feed com usuário não lança unauthorized", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.missions.feed();
      expect(Array.isArray(result)).toBe(true);
    });

    it("achievements.mine retorna array", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.achievements.mine();
      expect(Array.isArray(result)).toBe(true);
    });

    it("progress.get retorna defaults sem banco", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.progress.get();
      expect(result?.targetFollowers).toBe(2000);
    });
  });
});
