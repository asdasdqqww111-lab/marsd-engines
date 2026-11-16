import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { auditEvent } from "@/db/schema";
import { desc, eq, ilike, and, type SQL } from "drizzle-orm";
import { hasPermission, normalizeRole } from "@/lib/rbac";
import { HUDHUD_APPS } from "@/lib/registry";

export const dynamic = "force-dynamic";

/**
 * مركز التدقيق المحسّن — المرحلة 3.
 * فلاتر فعلية من searchParams (هدف، إجراء يحتوي نصًا، نتيجة).
 * لا بحث حر في metadata — يبقى الفلتر على حقول مفهرسة فقط
 * (audit_event_target_idx / audit_event_action_idx / audit_event_created_idx).
 */

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; action?: string; outcome?: string }>;
}) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const portalRole = normalizeRole(
    (session.user as { portalRole?: string | null }).portalRole,
  );
  if (!hasPermission(portalRole, "audit.read")) {
    redirect("/");
  }

  const sp = await searchParams;

  // تصفية المدخلات: target من السجل الرسمي فقط، outcome من قيم محددة
  const validTargets = ["portal", "hudhud_core", ...HUDHUD_APPS.map((a) => a.techId)];
  const target = sp.target && validTargets.includes(sp.target) ? sp.target : undefined;
  const outcome =
    sp.outcome === "success" || sp.outcome === "failure" ? sp.outcome : undefined;
  // action: بحث جزئي آمن على العمود المفهرس — مقيد الطول ومهرب تلقائيًا عبر ilike
  const action =
    sp.action && sp.action.length >= 2 && sp.action.length <= 64 ? sp.action : undefined;

  const conditions: SQL[] = [];
  if (target) conditions.push(eq(auditEvent.target, target));
  if (outcome) conditions.push(eq(auditEvent.outcome, outcome));
  if (action) conditions.push(ilike(auditEvent.action, `%${action}%`));

  const events = await db
    .select()
    .from(auditEvent)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditEvent.createdAt))
    .limit(200);

  const totalCount = events.length;

  return (
    <main>
      <div className="hudhud-page-head">
        <div>
          <h1 className="hudhud-page-title">مركز التدقيق</h1>
          <p className="hudhud-page-sub">
            {totalCount} حدث — من فعل ماذا ومتى، مع تنقية أسرار تلقائية
          </p>
        </div>
      </div>

      <form method="GET" className="hudhud-surface hudhud-form-row">
        <label className="hudhud-field">
          الهدف
          <select name="target" defaultValue={target ?? ""} className="hudhud-select">
            <option value="">الكل</option>
            <option value="portal">portal</option>
            <option value="hudhud_core">hudhud_core</option>
            {HUDHUD_APPS.map((a) => (
              <option key={a.techId} value={a.techId}>
                {a.techId}
              </option>
            ))}
          </select>
        </label>

        <label className="hudhud-field">
          الإجراء (يحتوي)
          <input
            name="action"
            defaultValue={action ?? ""}
            maxLength={64}
            placeholder="مثال: users.role_change"
            className="hudhud-input"
            style={{ direction: "ltr" }}
          />
        </label>

        <label className="hudhud-field">
          النتيجة
          <select name="outcome" defaultValue={outcome ?? ""} className="hudhud-select">
            <option value="">الكل</option>
            <option value="success">نجاح</option>
            <option value="failure">فشل</option>
          </select>
        </label>

        <button type="submit" className="hudhud-btn-primary">
          تصفية
        </button>
      </form>

      <div className="hudhud-surface" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
              <th style={{ padding: "10px", textAlign: "right" }}>الوقت</th>
              <th style={{ padding: "10px", textAlign: "right" }}>الفاعل</th>
              <th style={{ padding: "10px", textAlign: "right" }}>الإجراء</th>
              <th style={{ padding: "10px", textAlign: "right" }}>الهدف</th>
              <th style={{ padding: "10px", textAlign: "right" }}>النتيجة</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "16px", color: "var(--hudhud-text-secondary)", textAlign: "center" }}>
                  لا أحداث مطابقة للفلاتر المحددة — هذه قراءة فعلية من audit_event، ليست خطأ
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--hudhud-border)" }}>
                  <td style={{ padding: "10px", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                    {new Date(e.createdAt).toISOString()}
                  </td>
                  <td style={{ padding: "10px", fontSize: "0.85rem" }}>{e.actorEmail ?? "system"}</td>
                  <td style={{ padding: "10px" }}>
                    <code className="hudhud-code">{e.action}</code>
                  </td>
                  <td style={{ padding: "10px" }}>
                    <code className="hudhud-code">{e.target ?? "—"}</code>
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span
                      className={
                        e.outcome === "success"
                          ? "hudhud-badge hudhud-badge-ok"
                          : "hudhud-badge hudhud-badge-bad"
                      }
                    >
                      {e.outcome === "success" ? "نجاح" : "فشل"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="hudhud-note">
        الفلاتر تعمل على أعمدة مفهرسة فقط (target/action/outcome). لا بحث حر في metadata لتجنب
        استعلامات مكلفة على jsonb.
      </p>
    </main>
  );
}
