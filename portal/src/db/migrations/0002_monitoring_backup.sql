-- Migration 0002: Monitoring + backup audit tables (Phase 3)
-- Idempotent: safe to apply on fresh or existing hudhud_core databases.
-- Scope: portal database ONLY. No application database is touched.

-- Backup records — append-only audit trail of real pg_dump runs.
CREATE TABLE IF NOT EXISTS "backup_record" (
  "id" text PRIMARY KEY,
  "database_name" text NOT NULL,
  "trigger" text NOT NULL CHECK ("trigger" IN ('triggered', 'scheduled')),
  "outcome" text NOT NULL CHECK ("outcome" IN ('success', 'failure')),
  "tables_count" integer,
  "size_bytes" integer,
  "file_name" text,
  "error_detail" text,
  "started_at" timestamptz NOT NULL,
  "finished_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "backup_record_db_idx" ON "backup_record" ("database_name");
CREATE INDEX IF NOT EXISTS "backup_record_created_idx" ON "backup_record" ("created_at");

-- Restore records — every restore attempt is recorded with its real outcome.
-- Destructive restores always require explicit approval (documented separately).
CREATE TABLE IF NOT EXISTS "restore_record" (
  "id" text PRIMARY KEY,
  "database_name" text NOT NULL,
  "backup_file_name" text NOT NULL,
  "outcome" text NOT NULL CHECK ("outcome" IN ('success', 'failure', 'dry_run')),
  "error_detail" text,
  "actor_user_id" text,
  "actor_email" text,
  "started_at" timestamptz NOT NULL,
  "finished_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "restore_record_db_idx" ON "restore_record" ("database_name");
CREATE INDEX IF NOT EXISTS "restore_record_created_idx" ON "restore_record" ("created_at");

-- New RBAC permission: monitoring.view (admin + operator)
INSERT INTO "role_permission" ("id", "role", "permission", "description") VALUES
  ('rp_8', 'admin', 'monitoring.view', 'Admins can view monitoring (snapshots history + backup status)'),
  ('rp_9', 'operator', 'monitoring.view', 'Operators can view monitoring (snapshots history + backup status)')
ON CONFLICT ("role", "permission") DO NOTHING;

-- Audit the migration itself
INSERT INTO "audit_event" ("id", "action", "target", "outcome", "metadata")
VALUES ('audit_migration_0002', 'migration.applied', 'hudhud_core', 'success', '{"migration": "0002_monitoring_backup"}'::jsonb)
ON CONFLICT ("id") DO NOTHING;
