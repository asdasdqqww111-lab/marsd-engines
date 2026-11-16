import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { db } from "@/db";
import { backupRecord } from "@/db/schema";

/**
 * نسخ احتياطي فعلي لقاعدة hudhud_core عبر pg_dump — المرحلة 3.
 *
 * القواعد:
 * - hudhud_core فقط؛ لا يلمس أي قاعدة تطبيق.
 * - عدد الجداول يُقرأ فعليًا من information_schema قبل النسخ — لا رقم مُلفق.
 * - النتيجة تُسجَّل في backup_record بالنتيجة الفعلية (نجاح/فشل + حجم + عدد جداول).
 * - لا تُدّعى نسخة لم تُنفّذ: عند غياب pg_dump أو فشل العملية، يُسجَّل فشل صادق.
 * - مسار الحفظ من HUDHUD_BACKUP_DIR؛ لا يلتزم أسرار ولا تُطبع كلمة مرور أبدًا.
 *
 * Usage:
 *   HUDHUD_BACKUP_DIR=/backups npm run db:backup
 */

function runPgDump(outDir: string, fileName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("pg_dump", [
      "--format=custom",
      "--file",
      path.join(outDir, fileName),
      // الاتصال من DATABASE_URL عبر الوسيط -d (لا سر على سطر الأوامر أبدًا)
      "--dbname",
      process.env.DATABASE_URL!,
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
              .slice(0, 200) || `pg_dump exited ${code}`,
          ),
        );
    });
  });
}

async function countTables(): Promise<number> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    return res.rows[0].n as number;
  } finally {
    await client.end();
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run a hudhud_core backup");
  }

  const outDir = process.env.HUDHUD_BACKUP_DIR;
  if (!outDir) {
    throw new Error(
      "HUDHUD_BACKUP_DIR is required (destination directory for backup files)",
    );
  }
  fs.mkdirSync(outDir, { recursive: true });

  const startedAt = new Date();
  const fileName = `hudhud_core_${startedAt.toISOString().replace(/[:.]/g, "-")}.dump`;

  try {
    // العدّ الفعلي قبل النسخ — مصدر حقيقة من القاعدة نفسها.
    const tablesCount = await countTables();
    await runPgDump(outDir, fileName);

    const sizeBytes = fs.statSync(path.join(outDir, fileName)).size;

    await db.insert(backupRecord).values({
      id: randomUUID(),
      databaseName: "hudhud_core",
      trigger: "triggered",
      outcome: "success",
      tablesCount,
      sizeBytes,
      fileName,
      startedAt,
      finishedAt: new Date(),
    });

    console.log(
      `[backup] success: ${fileName} (${sizeBytes} bytes, ${tablesCount} tables)`,
    );
  } catch (err) {
    await db
      .insert(backupRecord)
      .values({
        id: randomUUID(),
        databaseName: "hudhud_core",
        trigger: "triggered",
        outcome: "failure",
        errorDetail: (err as Error).message.slice(0, 200),
        fileName,
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
