import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { AdminPermission } from "../../shared/adminPermissions";
import type { TrpcContext } from "./context";
import { hasAnyPermission, hasPermission, isPlatformAdmin, resolveUserPermissions } from "./permissions";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para continuar" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isPlatformAdmin(ctx.user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem fazer isso" });
  }
  return next({ ctx });
});

export const staffProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const permissions = await resolveUserPermissions(ctx.user);
  if (!isPlatformAdmin(ctx.user) && permissions.length === 0) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem acesso ao painel administrativo" });
  }
  return next({ ctx: { ...ctx, permissions } });
});

export function permissionProcedure(required: AdminPermission | AdminPermission[]) {
  const requiredList = Array.isArray(required) ? required : [required];
  return protectedProcedure.use(async ({ ctx, next }) => {
    const permissions = await resolveUserPermissions(ctx.user);
    if (!hasAnyPermission(ctx.user, permissions, requiredList)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Permissão insuficiente para esta ação" });
    }
    return next({ ctx: { ...ctx, permissions } });
  });
}

export function assertPermission(
  user: NonNullable<TrpcContext["user"]>,
  permissions: AdminPermission[],
  required: AdminPermission
) {
  if (!hasPermission(user, permissions, required)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Permissão insuficiente para esta ação" });
  }
}
