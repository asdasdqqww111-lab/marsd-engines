import { describe, expect, it } from "vitest";
import {
  checkPortalRoleChange,
  hasPermission,
  normalizeRole,
  PERMISSION_MATRIX,
} from "@/lib/rbac";

describe("rbac", () => {
  it("admin has all six permissions", () => {
    expect(PERMISSION_MATRIX.admin).toHaveLength(6);
    expect(hasPermission("admin", "users.manage")).toBe(true);
    expect(hasPermission("admin", "monitoring.view")).toBe(true);
  });

  it("operator can view monitoring but cannot manage settings or users", () => {
    expect(hasPermission("operator", "monitoring.view")).toBe(true);
    expect(hasPermission("operator", "settings.manage")).toBe(false);
    expect(hasPermission("operator", "users.manage")).toBe(false);
    expect(hasPermission("operator", "health.refresh")).toBe(true);
  });

  it("viewer can only view the dashboard", () => {
    expect(hasPermission("viewer", "dashboard.view")).toBe(true);
    expect(hasPermission("viewer", "audit.read")).toBe(false);
    expect(hasPermission("viewer", "monitoring.view")).toBe(false);
  });

  it("fails closed on unknown roles", () => {
    expect(hasPermission("superadmin", "dashboard.view")).toBe(false);
    expect(hasPermission(null, "dashboard.view")).toBe(false);
  });

  it("normalizes unknown roles to viewer", () => {
    expect(normalizeRole("banana")).toBe("viewer");
    expect(normalizeRole(null)).toBe("viewer");
    expect(normalizeRole("admin")).toBe("admin");
  });
});

describe("checkPortalRoleChange", () => {
  it("allows changing another operator's role", () => {
    const r = checkPortalRoleChange({
      actorUserId: "u-1",
      actorPortalRole: "admin",
      targetUserId: "u-2",
      newRole: "viewer",
    });
    expect(r.allowed).toBe(true);
    expect(r.reason).toBeUndefined();
  });

  it("allows keeping your own role unchanged", () => {
    const r = checkPortalRoleChange({
      actorUserId: "u-1",
      actorPortalRole: "admin",
      targetUserId: "u-1",
      newRole: "admin",
    });
    expect(r.allowed).toBe(true);
  });

  it("forbids self-demotion (lockout protection)", () => {
    const r = checkPortalRoleChange({
      actorUserId: "u-1",
      actorPortalRole: "admin",
      targetUserId: "u-1",
      newRole: "viewer",
    });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("self_demotion_forbidden");
  });

  it("forbids any self role change (defense in depth)", () => {
    const r = checkPortalRoleChange({
      actorUserId: "u-3",
      actorPortalRole: "operator",
      targetUserId: "u-3",
      newRole: "admin",
    });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("self_demotion_forbidden");
  });
});
