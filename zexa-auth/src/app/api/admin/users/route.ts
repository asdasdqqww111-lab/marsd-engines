import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUsers } from "@/utils/users";

/**
 * HUDHUD fix C-02 — defense-in-depth for the admin users API.
 *
 * Previously this route relied solely on:
 *   1. the admin layout guard (UI layer), and
 *   2. the implicit admin check inside Better Auth's listUsers endpoint.
 *
 * The route itself never verified the session, and a permission failure
 * surfaced as a generic 500 instead of a proper 401/403 — misleading for
 * operators and inconsistent with HUDHUD's fail-closed standard.
 *
 * Now the route checks the session and the admin role explicitly before
 * calling getUsers. Anonymous -> 401, non-admin -> 403, both without
 * leaking any user data. The Better Auth check inside getUsers remains
 * as an additional layer (defense-in-depth, not the only one).
 */

export async function GET(request: NextRequest) {
  // --- Auth check (fail-closed, server-side) ---
  let session: { user: { role?: string | null } | null } | null = null;
  try {
    session = (await auth.api.getSession({
      headers: await headers(),
    })) as { user: { role?: string | null } | null } | null;
  } catch {
    // Session verification failed — treat as unauthenticated, never 500.
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // --- Input validation (bounds to prevent abuse via query params) ---
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10),
  );
  const offset = (page - 1) * limit;
  const sortBy = searchParams.get("sortBy") || undefined;
  let sortDirection = searchParams.get("sortDirection") || undefined;
  if (sortDirection !== "asc" && sortDirection !== "desc") {
    sortDirection = undefined;
  }
  const role = searchParams.get("role") || undefined;
  const status = searchParams.get("status") || undefined;
  const email = searchParams.get("email") || undefined;
  const name = searchParams.get("name") || undefined;

  try {
    const { users, total } = await getUsers({
      limit,
      offset,
      sortBy,
      sortDirection,
      role,
      status,
      email,
      name,
    });

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
