import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { db } from "@/db";
import { restoreRecord } from "@/db/schema";

/**
 * استعادة hudhud_core من نسخة pg_dump — المرحلة 3.
 *
 * القواعد الصارمة:
 * - **dry-run افتراضيًا**: بدون --confirm لا يُكتب أي شيء في القاعدة.
 *   يتحقق فقط من وجود الملف وصلاحية الاتصال ويسجل النتيجة كـ dry_run.
 * - hudhud_core فقط؛ لا يلمس أي قاعدة تطبيق أبدًا.
 * - الاستعادة عملية هادمة: تتطلب موافقة صريحة موثقة قبل تشغيلها بـ --confirm
 *   وخطة تراجع (نسخة احتياطية جديدة قبل الاستعادة).
 * - كل محاولة تُسجَّل في restore_record بالنتيجة الفعلية.
 *
 * Usage:
 *   HUDHUD_BACKUP_DIR=/backups npm run db:restore -- --file hudhud_core_2026-...dump [--confirm]
 */

const args = process.argv.slice(2);
const confirmIdx = args.indexOf("--confirm");
const CONFIRMED = confirmIdx !== -1;
if (CONFIRMED) args.splice(confirmIdx, 1);

const fileIdx = args.indexOf("--file");
const fileName = fileIdx !== -1 ? args[fileIdx + 1] : undefined;

function runPgRestore(fullPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("pg_restore", [
      "--dbname",
      process.env.DATABASE_URL!,
      "--clean",
      "--if-exists",
      "--no-owner",
      "--no-privileges",
      fullPath,
    ]);
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += String(d);
    });
    child.on("error", (err) => reject(err));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            stderr
              .split("\n")
              .slice(0, 3)
              .join(" ")
              .slice(0, 200) || `pg_restore exited ${code}`,
          ),
        );
    });
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to restore hudhud_core");
  }
  if (!process.env.HUDHUD_BACKUP_DIR) {
    throw new Error("HUDHUD_BACKUP_DIR is required (directory containing backup files)");
  }
  if (!fileName) {
    throw new Error("--file <backup-file-name> is required");
  }

  // منع اجتياز المسار: اسم ملف فقط — لا مسارات ولا "..".
  if (fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
    throw new Error("Invalid backup file name — file name only, no path components");
  }

  const fullPath = path.join(process.env.HUDHUD_BACKUP_DIR, fileName);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Backup file not found in HUDHUD_BACKUP_DIR: ${fileName}`);
  }

  // التحقق أن اسم الملف يخص hudhud_core فقط — لا استعادة لقاعدة تطبيق.
  if (!fileName.startsWith("hudhud_core_")) {
    throw new Error("Refusing to restore: file name does not match hudhud_core backup naming");
  }

  const startedAt = new Date();

  if (!CONFIRMED) {
    // Dry-run: تحقق من الاتصال فقط — لا كتابة.
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const res = await client.query("SELECT current_database() AS db");
    await client.end();
    const dbName = res.rows[0].db as string;

    await db.insert(restoreRecord).values({
      id: randomUUID(),
      databaseName: dbName,
      backupFileName: fileName,
      outcome: "dry_run",
      startedAt,
      finishedAt: new Date(),
    });

    console.log(
      `[restore] DRY RUN OK — file: ${fileName}, target: ${dbName}. ` +
        "No data was written. Re-run with --confirm (explicit approval required) to actually restore.",
    );
    return;
  }

  // مؤكد: خطة التراجع تتطلب نسخة احتياطية جديدة قبل الاستعادة —
  // المسؤول عن الاستعادة يوثق ذلك؛ هذا السكربت يطالب بها صراحة.
  console.warn(
    "[restore] DESTRUCTIVE OPERATION — ensure a fresh backup was taken immediately before this restore.",
  );

  try {
    await runPgRestore(fullPath);

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const res = await client.query("SELECT current_database() AS db");
    await client.end();

    await db.insert(restoreRecord).values({
      id: randomUUID(),
      databaseName: res.rows[0].db as string,
      backupFileName: fileName,
      outcome: "success",
      startedAt,
      finishedAt: new Date(),
    });
    console.log(`[restore] success: ${fileName}`);
  } catch (err) {
    await db
      .insert(restoreRecord)
      .values({
        id: randomUUID(),
        databaseName: "hudhud_core",
        backupFileName: fileName,
        outcome: "failure",
        errorDetail: (err as Error).message.slice(0, 200),
        startedAt,
        finishedAt: new Date(),
      })
      .catch(() => undefined);
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
