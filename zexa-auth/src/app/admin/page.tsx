import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin Dashboard | HUDHUD Identity",
  description: "Real overview of the identity service",
};

/**
 * HUDHUD M-02 — real admin overview.
 *
 * Previously /admin was only a redirect to /admin/users. This replaces the
 * redirect with a real dashboard built from verifiable database facts —
 * no mock numbers. Every figure on the page is a count query executed
 * against this environment's PostgreSQL at render time.
 *
 * Protection: the admin layout guard already enforces session + admin role
 * before this page renders (server-side, C-02 standard).
 */

async function safeCount(fn: () => Promise<number>): Promise<number | null> {
  try {
    return await fn();
  } catch {
    return null; // Error is displayed honestly as "error", never faked.
  }
}

export default async function AdminOverviewPage() {
  const { db } = await import("@/db");

  const [userCount, sessionCount, adminCount] = await Promise.all([
    safeCount(async () => (await db.query.user.findMany({ columns: { id: true } })).length),
    safeCount(async () => (await db.query.session.findMany({ columns: { id: true } })).length),
    safeCount(async () => {
      const users = await db.query.user.findMany({
        columns: { role: true },
      });
      return users.filter((u) => u.role === "admin").length;
    }),
  ]);

  const identityEnabled = process.env.HUDHUD_IDENTITY_ENABLED === "true";

  const stats = [
    { label: "Users", value: userCount, href: "/admin/users" },
    { label: "Active sessions", value: sessionCount, href: "/admin/users" },
    { label: "Admins", value: adminCount, href: "/admin/users?role=admin" },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Live counts from this environment&apos;s database — real data, no mock indicators.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl">
                  {stat.value === null ? (
                    <Badge variant="destructive">Error</Badge>
                  ) : (
                    stat.value
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>HUDHUD Identity status</CardTitle>
          <CardDescription>
            The OIDC provider is opt-in. While disabled, this service keeps local
            authentication unchanged.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant={identityEnabled ? "default" : "secondary"}>
            {identityEnabled ? "Enabled (opt-in)" : "Disabled (default)"}
          </Badge>
          <Link
            href="/admin/settings"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            View full settings →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
