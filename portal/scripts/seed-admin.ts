import "dotenv/config";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

// Seeds the initial portal admin. Idempotent by email.
// Credentials come from the environment; nothing is hardcoded.
//
// Usage: HUDHUD_ADMIN_EMAIL=... HUDHUD_ADMIN_PASSWORD=... npm run db:seed

async function main() {
  const email = process.env.HUDHUD_ADMIN_EMAIL;
  const password = process.env.HUDHUD_ADMIN_PASSWORD;
  const name = process.env.HUDHUD_ADMIN_NAME ?? "HUDHUD Admin";

  if (!email || !password) {
    throw new Error(
      "HUDHUD_ADMIN_EMAIL and HUDHUD_ADMIN_PASSWORD must be set to seed the portal admin",
    );
  }

  const existing = await db.query.user.findFirst({ where: (u, { eq }) => eq(u.email, email) });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  await auth.api.createUser({
    body: {
      email,
      password,
      name,
      role: "admin",
      data: { portalRole: "admin" },
    },
  });

  console.log(`Seeded portal admin: ${email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
