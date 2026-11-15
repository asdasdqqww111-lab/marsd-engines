/**
 * RBAC للبوابة — 3 أدوار ثابتة في المرحلة 1.
 *
 * الصلاحيات (استلهام نموذج nchat per-app RBAC):
 * - dashboard.view: رؤية لوحة القيادة.
 * - audit.read: قراءة سجل التدقيق.
 * - health.refresh: تشغيل فحص الصحة اليدوي.
 * - settings.manage: إدارة إعدادات البوابة.
 * - users.manage: إدارة مستخدمي البوابة.
 */

export type PortalRole = "admin" | "operator" | "viewer";

export const PORTAL_ROLES: readonly PortalRole[] = ["admin", "operator", "viewer"] as const;

export type Permission =
  | "dashboard.view"
  | "audit.read"
  | "health.refresh"
  | "settings.manage"
  | "users.manage";

export const PERMISSION_MATRIX: Record<PortalRole, readonly Permission[]> = {
  admin: [
    "dashboard.view",
    "audit.read",
    "health.refresh",
    "settings.manage",
    "users.manage",
  ],
  operator: ["dashboard.view", "audit.read", "health.refresh"],
  viewer: ["dashboard.view"],
};

/**
 * تحقق أن الدور يملك صلاحية. أدوار غير معروفة = لا صلاحيات (fail-closed).
 */
export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const perms = PERMISSION_MATRIX[role as PortalRole];
  if (!perms) return false;
  return perms.includes(permission);
}

/**
 * المستخدم بلا portalRole مُخصص → viewer (أقل امتياز افتراضيًا).
 */
export function normalizeRole(role: string | null | undefined): PortalRole {
  if (role === "admin" || role === "operator" || role === "viewer") return role;
  return "viewer";
}

/**
 * فحص نقدي لتغيير دور مشغّل — دالة نقية قابلة للاختبار المباشر.
 *
 * القاعدة الأمنية: لا يجوز لأي مشغّل تخفيض دوره الخاص،
 * لأن ذلك قد يقفل المستخدم خارج البوابة (تغييرات الإقفال تتطلب مراجعة منفصلة).
 */
export interface RoleChangeCheck {
  allowed: boolean;
  reason?: "self_demotion_forbidden";
}

export function checkPortalRoleChange(input: {
  actorUserId: string;
  actorPortalRole: PortalRole;
  targetUserId: string;
  newRole: PortalRole;
}): RoleChangeCheck {
  const isSelf = input.targetUserId === input.actorUserId;
  if (isSelf && input.newRole !== input.actorPortalRole) {
    return { allowed: false, reason: "self_demotion_forbidden" };
  }
  return { allowed: true };
}
