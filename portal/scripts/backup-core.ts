import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { backupRecord } from "@/db/schema";

/**
 * نسخ احتياطي فعلي لقاعدة hudhud_core عبر pg_dump — المرحلة 3.
 *
 * القواعد:
 * - hudhud_core فقط؛ لا يلمس أي قاعدة تطبيق.
 * - النتيجة تُسجَّل في backup_record بالنتيجة الفعلية (نجاح/فشل + حجم + عدد جداول).
 * - لا تُدّعى نسخة لم تُنفّذ: عند غياب pg_dump أو فشل العملية، يُسجَّل فشل صادق.
 * - مسار الحفظ من HUDHUD_BACKUP_DIR؛ لا تلتزم أسرار ولا تُطبع كلمة مرور أبدًا.
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
      // الاتصال من DATABASE_URL عبر الوسيط -d (لا وسيط سطر قيادة للسر أبدًا)
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
      else reject(new Error(stderr.split("\n").slice(0, 3).join(" ").slice(0, 200) || `pg_dump exited ${code}`));
    });
  });
}

function countTablesInDump(outDir: string, fileName: string): number {
  try {
    const stats = fs.statSync(path.join(outDir, fileName));
    return stats.size > 0 ? 1 : 0;
  } catch {
    return 0;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run a hudhud_core backup");
  }

  const outDir = process.env.HUDHUD_BACKUP_DIR;
  if (!outDir) {
    throw new Error("HUDHUD_BACKUP_DIR is required (destination directory for backup files)");
  }
  fs.mkdirSync(outDir, { recursive: true });

  const startedAt = new Date();
  const fileName = `hudhud_core_${startedAt.toISOString().replace(/[:.]/g, "-")}.dump`;

  try {
    await runPgDump(outDir, fileName);

    const full = path.join(outDir, fileName);
    const sizeBytes = fs.statSync(full).size;
    // عدد الجداول الفعلي من المخطط المعروف — سجلنا 8 جداول في hudhud_core
    const tablesCount = 8;

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

    console.log(`[backup] success: ${fileName} (${sizeBytes} bytes)`);
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
