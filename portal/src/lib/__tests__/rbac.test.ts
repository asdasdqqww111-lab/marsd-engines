import { describe, expect, it } from "vitest";
import { hasPermission, normalizeRole, PERMISSION_MATRIX } from "@/lib/rbac";

describe("rbac", () => {
  it("admin has all five permissions", () => {
    expect(PERMISSION_MATRIX.admin).toHaveLength(5);
    expect(hasPermission("admin", "users.manage")).toBe(true);
  });

  it("operator cannot manage settings or users", () => {
    expect(hasPermission("operator", "settings.manage")).toBe(false);
    expect(hasPermission("operator", "users.manage")).toBe(false);
    expect(hasPermission("operator", "health.refresh")).toBe(true);
  });

  it("viewer can only view the dashboard", () => {
    expect(hasPermission("viewer", "dashboard.view")).toBe(true);
    expect(hasPermission("viewer", "audit.read")).toBe(false);
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
