import type { User } from "../../drizzle/schema";
import type { AdminPermission } from "../../shared/adminPermissions";
import { ALL_ADMIN_PERMISSIONS } from "../../shared/adminPermissions";
import { getUserPermissions } from "../db";

export function isPlatformAdmin(user: Pick<User, "role">): boolean {
  return user.role === "admin";
}

export async function resolveUserPermissions(user: Pick<User, "id" | "role">): Promise<AdminPermission[]> {
  if (isPlatformAdmin(user)) return [...ALL_ADMIN_PERMISSIONS];
  return getUserPermissions(user.id);
}

export function hasPermission(
  user: Pick<User, "role">,
  permissions: AdminPermission[],
  required: AdminPermission
): boolean {
  if (isPlatformAdmin(user)) return true;
  return permissions.includes(required);
}

export function hasAnyPermission(
  user: Pick<User, "role">,
  permissions: AdminPermission[],
  required: AdminPermission[]
): boolean {
  if (isPlatformAdmin(user)) return true;
  return required.some(p => permissions.includes(p));
}

export function isStaff(user: Pick<User, "role">, permissions: AdminPermission[]): boolean {
  return isPlatformAdmin(user) || permissions.length > 0;
}
