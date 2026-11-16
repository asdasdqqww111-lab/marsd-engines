import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * hudhud_core schema — قاعدة البوابة فقط.
 *
 * عزل صارم: لا علاقة ولا وصول لأي قاعدة تطبيق (hudhud_neureed،
 * hudhud_nchat، ...). التكامل مع التطبيقات عبر HTTP فقط.
 */

/* ── Better Auth core tables ───────────────────────────── */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  /** دور RBAC في البوابة: admin | operator | viewer (انظر src/lib/rbac.ts) */
  portalRole: text("portal_role").notNull().default("viewer"),
  /** للاستخدام من admin plugin (defaultRole) */
  role: text("role").notNull().default("user"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$defaultFn(
    () => new Date(),
  ),
});

/* ── Portal domain tables ────────────────────────────── */

/**
 * سجل الأحداث الإدارية — من فعل ماذا ومتى ومن أي IP.
 */
export const auditEvent = pgTable(
  "audit_event",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    actorUserId: text("actor_user_id"),
    actorEmail: text("actor_email"),
    action: text("action").notNull(),
    /** techId من سجل التطبيقات، أو "portal" للأحداث الداخلية */
    target: text("target"),
    outcome: text("outcome").notNull(), // success | failure
    ip: text("ip"),
    userAgent: text("user_agent"),
    /** تفاصيل مُنقّاة من الأسرار (انظر src/lib/audit.ts) */
    metadata: jsonb("metadata"),
  },
  (t) => [
    index("audit_event_actor_idx").on(t.actorUserId),
    index("audit_event_action_idx").on(t.action),
    index("audit_event_target_idx").on(t.target),
    index("audit_event_created_idx").on(t.createdAt),
  ],
);

/**
 * لقطات حالة التطبيقات — تُدرج جديدة فقط، لا تحديث بالكتابة فوق.
 * لا يوجد عمود URL بالتصميم: العناوين الداخلية لا تُخزن في القاعدة.
 */
export const appHealthSnapshot = pgTable(
  "app_health_snapshot",
  {
    id: text("id").primaryKey(),
    techId: text("tech_id").notNull(),
    status: text("status").notNull(), // healthy | degraded | down | unknown
    httpStatus: integer("http_status"),
    latencyMs: integer("latency_ms"),
    detail: text("detail"),
    checkedAt: timestamp("checked_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("app_health_snapshot_tech_idx").on(t.techId),
    index("app_health_snapshot_checked_idx").on(t.checkedAt),
  ],
);

/* ── RBAC ─────────────────────────────────────────────── */

/**
 * الأدوار والصلاحيات — استلهام من نموذج nchat per-app RBAC
 * (20260212_add_per_app_rbac.sql) لكن مُبسّط لاحتياجات البوابة في المرحلة 1.
 */
export const rolePermission = pgTable(
  "role_permission",
  {
    id: text("id").primaryKey(),
    role: text("role").notNull(),
    permission: text("permission").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [uniqueIndex("role_permission_unique").on(t.role, t.permission)],
);

/* ── Monitoring (المرحلة 3) ──────────────────────────── */

/**
 * سجل النسخ الاحتياطي — كل نتيجة فعلية لـ pg_dump تُسجّل هنا.
 * لا يُدّعى نجاح نسخة لم تُنفّذ: المسار يعيد "unknown" حين لا توجد سجلات.
 */
export const backupRecord = pgTable(
  "backup_record",
  {
    id: text("id").primaryKey(),
    /** قاعدة البيانات التي نُسّحت (hudhud_core فقط في المرحلة 3) */
    databaseName: text("database_name").notNull(),
    /** triggered | scheduled */
    trigger: text("trigger").notNull(),
    /** success | failure */
    outcome: text("outcome").notNull(),
    /** عدد الجداول المكتوبة في الملف (عند النجاح) */
    tablesCount: integer("tables_count"),
    /** حجم الملف بالبايت (عند النجاح) */
    sizeBytes: integer("size_bytes"),
    /** اسم الملف الظاهر فقط (بدون مسارات داخلية) */
    fileName: text("file_name"),
    /** خطأ مختصر عند الفشل (بلا أسرار) */
    errorDetail: text("error_detail"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("backup_record_db_idx").on(t.databaseName),
    index("backup_record_created_idx").on(t.createdAt),
  ],
);

/**
 * سجل عمليات الاستعادة — استعادة hudhud_core من ملف نسخة احتياطية.
 * كل عملية تُوثق مع النتيجة الفعلية؛ الاستعادة الهادّامة تتطلب موافقة صريحة.
 */
export const restoreRecord = pgTable(
  "restore_record",
  {
    id: text("id").primaryKey(),
    databaseName: text("database_name").notNull(),
    /** اسم ملف النسخة الاحتياطية المستخدم (بدون مسار) */
    backupFileName: text("backup_file_name").notNull(),
    /** success | failure | dry_run */
    outcome: text("outcome").notNull(),
    errorDetail: text("error_detail"),
    actorUserId: text("actor_user_id"),
    actorEmail: text("actor_email"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("restore_record_db_idx").on(t.databaseName),
    index("restore_record_created_idx").on(t.createdAt),
  ],
);

/* ── Types ─────────────────────────────────────────────── */

export type User = typeof user.$inferSelect;
export type AuditEvent = typeof auditEvent.$inferSelect;
export type AppHealthSnapshot = typeof appHealthSnapshot.$inferSelect;
export type BackupRecord = typeof backupRecord.$inferSelect;
export type RestoreRecord = typeof restoreRecord.$inferSelect;
