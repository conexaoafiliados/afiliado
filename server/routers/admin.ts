import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ALL_ADMIN_PERMISSIONS, ADMIN_PERMISSIONS } from "../../shared/adminPermissions";
import type { AdminPermission } from "../../shared/adminPermissions";
import {
  adminDeleteCommunityPost,
  getAdminCommerceOverview,
  getAdminEngagementRecent,
  getAdminGrowthLeaders,
  getAdminLearningOverview,
  getAdminPlatformOverview,
  getAdminSectionCounts,
  getUserPermissions,
  listAdminPostsForModeration,
  listAdminUsers,
  setUserPermissions,
  updateUserRole,
  getUserById,
} from "../db";
import { isPlatformAdmin, isSuperAdmin, resolveUserPermissions } from "../_core/permissions";
import {
  adminProcedure,
  permissionProcedure,
  protectedProcedure,
  router,
  staffProcedure,
} from "../_core/trpc";

export const adminRouter = router({
  myAccess: protectedProcedure.query(async ({ ctx }) => {
    const permissions = await resolveUserPermissions(ctx.user);
    const superAdmin = isSuperAdmin(ctx.user);
    return {
      isAdmin: isPlatformAdmin(ctx.user),
      isSuperAdmin: superAdmin,
      canManageAdmins: superAdmin,
      isStaff: isPlatformAdmin(ctx.user) || permissions.length > 0,
      permissions,
    };
  }),

  overview: staffProcedure.query(async ({ ctx }) => {
    const permissions = await resolveUserPermissions(ctx.user);
    if (!isPlatformAdmin(ctx.user) && !permissions.includes(ADMIN_PERMISSIONS.ANALYTICS_VIEW)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para ver analytics" });
    }
    const [platform, sections] = await Promise.all([
      getAdminPlatformOverview(),
      getAdminSectionCounts(),
    ]);
    return { platform, sections };
  }),

  users: permissionProcedure(ADMIN_PERMISSIONS.USERS_MANAGE)
    .input(
      z
        .object({
          query: z.string().max(80).optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input }) =>
      listAdminUsers({
        query: input?.query,
        limit: input?.limit ?? 50,
        offset: input?.offset ?? 0,
      })
    ),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isSuperAdmin(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas @conelheiros pode promover ou remover administradores",
        });
      }

      const target = await getUserById(input.userId);
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      if (isSuperAdmin(target) && input.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "O administrador principal não pode ser rebaixado",
        });
      }

      await updateUserRole(input.userId, input.role);
      if (input.role === "admin") {
        await setUserPermissions(input.userId, [], ctx.user.id);
      } else {
        await setUserPermissions(input.userId, [], ctx.user.id);
      }
      return { success: true };
    }),

  setPermissions: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        permissions: z.array(z.enum(ALL_ADMIN_PERMISSIONS as [AdminPermission, ...AdminPermission[]])),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isSuperAdmin(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas @conelheiros pode alterar permissões de outros usuários",
        });
      }

      const target = await getUserById(input.userId);
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      if (isSuperAdmin(target)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "O administrador principal já tem acesso total",
        });
      }

      if (target.role === "admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Remova o papel admin antes de definir permissões parciais",
        });
      }

      await setUserPermissions(input.userId, input.permissions, ctx.user.id);
      return { success: true };
    }),

  growth: permissionProcedure(ADMIN_PERMISSIONS.ANALYTICS_VIEW)
    .input(z.object({ limit: z.number().min(1).max(100).default(30) }).optional())
    .query(async ({ input }) => getAdminGrowthLeaders(input?.limit ?? 30)),

  engagement: permissionProcedure(ADMIN_PERMISSIONS.ANALYTICS_VIEW).query(async () =>
    getAdminEngagementRecent(20)
  ),

  commerce: permissionProcedure([ADMIN_PERMISSIONS.SHOP_MANAGE, ADMIN_PERMISSIONS.ANALYTICS_VIEW]).query(
    async () => getAdminCommerceOverview()
  ),

  learning: permissionProcedure([ADMIN_PERMISSIONS.LEARNING_MANAGE, ADMIN_PERMISSIONS.ANALYTICS_VIEW]).query(
    async () => getAdminLearningOverview()
  ),

  moderationPosts: permissionProcedure(ADMIN_PERMISSIONS.COMMUNITY_MODERATE)
    .input(z.object({ limit: z.number().min(1).max(50).default(30), offset: z.number().min(0).default(0) }).optional())
    .query(async ({ input }) => listAdminPostsForModeration(input?.limit ?? 30, input?.offset ?? 0)),

  deletePost: permissionProcedure(ADMIN_PERMISSIONS.COMMUNITY_MODERATE)
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ input }) => {
      const ok = await adminDeleteCommunityPost(input.postId);
      if (!ok) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível remover o post" });
      }
      return { success: true };
    }),

  /** Lista permissões disponíveis (qualquer staff) */
  permissionCatalog: staffProcedure.query(() => ({
    permissions: ALL_ADMIN_PERMISSIONS,
  })),
});
