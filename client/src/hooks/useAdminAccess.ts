import { ADMIN_PERMISSIONS } from "@shared/adminPermissions";
import { trpc } from "@/lib/trpc";

export function useAdminAccess() {
  const { data, isLoading } = trpc.admin.myAccess.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  const permissions = data?.permissions ?? [];
  const isAdmin = data?.isAdmin ?? false;
  const isStaff = data?.isStaff ?? false;

  function can(permission: string) {
    return isAdmin || permissions.includes(permission);
  }

  return {
    isLoading,
    isAdmin,
    isStaff,
    permissions,
    can,
    canViewAnalytics: can(ADMIN_PERMISSIONS.ANALYTICS_VIEW),
    canManageUsers: can(ADMIN_PERMISSIONS.USERS_MANAGE),
    canPublishAnnouncements: can(ADMIN_PERMISSIONS.ANNOUNCEMENTS_PUBLISH),
    canModerate: can(ADMIN_PERMISSIONS.COMMUNITY_MODERATE),
    canShop: can(ADMIN_PERMISSIONS.SHOP_MANAGE),
    canLearning: can(ADMIN_PERMISSIONS.LEARNING_MANAGE),
  };
}
