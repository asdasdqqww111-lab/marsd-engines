import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

/**
 * يطبّق ترحيلات hudhud_core من مجلد src/db/migrations بالترتيب.
 * آمن للتنفيذ المتكرر (كل ترحيل idempotent + جدول تتبع داخلي).
 */

const MIGRATIONS_DIR = path.join(process.cwd(), "src", "db", "migrations");
const TRACKING_TABLE = "_portal_migrations_applied";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to apply hudhud_core migrations");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No migration files found in", MIGRATIONS_DIR);
      return;
    }

    for (const file of files) {
      const res = await client.query(
        `SELECT 1 FROM ${TRACKING_TABLE} WHERE filename = $1`,
        [file],
      );
      if (res.rowCount && res.rowCount > 0) {
        console.log(`[skip] ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`[apply] ${file}`);
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          `INSERT INTO ${TRACKING_TABLE} (filename) VALUES ($1)`,
          [file],
        );
        await client.query("COMMIT");
        console.log(`[done] ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(
          `Migration ${file} failed and rolled back: ${
            (err as Error).message
          }`,
        );
      }
    }

    console.log("All hudhud_core migrations applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
