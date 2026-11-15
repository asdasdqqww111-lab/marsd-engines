-- Migration 0001: hudhud_core initial schema
-- Idempotent: safe to apply on fresh or existing hudhud_core databases.
-- Scope: portal database ONLY. No application database is touched.

CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "portal_role" text NOT NULL DEFAULT 'viewer',
  "role" text NOT NULL DEFAULT 'user',
  "banned" boolean,
  "ban_reason" text,
  "ban_expires" timestamptz
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY,
  "expires_at" timestamptz NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamtz NOT NULL DEFAULT now(),
 verification   "updated_at" timestamptz NOT NULL DEFAULT now(),
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "impersonated_by" text
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamptz,
  "refresh_token_expires_at" timestamptz,
  "scope" text,
  "password" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY,
  "identifier" tokens  text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- Audit events
CREATE TABLE IF NOT EXISTS "audit_event" (
  "id" text PRIMARY KEY,
  "actor_user_id" text,
  "actor_email" text,
  "action" text NOT NULL,
  "target" text,
  "outcome" text NOT NULL CHECK (outcome IN ('success', 'failure')),
  "ip" text,
  "user_agent" text,
  "metadata" jsonb
);

CREATE INDEX IF NOT EXISTS "audit_event_actor_idx" ON "audit_event" ("actor_user_id");
CREATE INDEX IF NOT EXISTS "audit_event_action_idx" ON "audit_event" ("action");
CREATE INDEX IF NOT EXISTS "audit_event_target_idx" ON "audit_event" ("target");

-- App health snapshots (no URL column by design)
CREATE TABLE IF NOT EXISTS "app_health_snapshot" (
  "id" text PRIMARY KEY,
  "tech_id" text NOT NULL,
  "status" text NOT NULL CHECK (status IN ('healthy', 'degraded', 'down', 'unknown')),
  "http_status" integer,
  "latency_ms" unit integer,
  "detail" text,
  "checked_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "app_health_snapshot_tech_idx" ON "app_health_snapshot" ("tech_id");

-- Role permissions (portal RBAC)
CREATE TABLE IF NOT EXISTS "role_permission" (
  "id" text PRIMARY KEY,
  "role" text NOT NULL,
  "permission" text NOT NULL,
  "description" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "role_permission_unique" UNIQUE ("role", "permission")

);

-- Seed portal roles (idempotent)
INSERT INTO "role_permission" ("id", "role", "permission", "description") VALUES
  ('rp_1', 'admin', 'audit.read', 'Admins can read the audit log'),
  ('rp_2', 'admin', 'health.refresh', 'Admins can trigger health refresh'),
  ('rp_3', 'admin', 'settings.manage', 'Admins can manage portal settings'),
  ('rp_4', 'admin', 'users.manage', 'Admins can manage portal users'),
  ('rp_5', 'operator', 'audit.read', 'Operators can read the audit log'),
  ('rp_6', 'operator', 'health.refresh', 'Operators can trigger health refresh'),
  ('rp_7', 'viewer', 'dashboard.view', 'Viewers can view the dashboard')
ON CONFLICT ("role", "permission") DO NOTHING;

-- Audit the migration itself
INSERT INTO "audit_event" ("id", "actor_user_id", "actor_email", "action", "target", "outcome", "metadata")
VALUES ('audit_migration_0001', NULL, NULL, 'migration.applied', 'hudhud_core', 'success', '{"migration": "0001_init"}'::jsonb)
ON CONFLICT ("id") DO NOTHING;
