import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import DashboardLayout from "@/components/admin/dashboard-layout";
import { ControlReturnLink } from "@/components/control-return-link";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    return notFound();
  }

  /**
   * HUDHUD M-04 — the CONTROL return link is a Server Component rendered
   * into the client layout as a prop/slot: the env-driven URL stays on the
   * server; the client layout never receives the raw value as data.
   * Hidden entirely when HUDHUD_CONTROL_URL is unset (honest behavior).
   */
  return (
    <DashboardLayout controlReturnSlot={<ControlReturnLink />}>
      {children}
    </DashboardLayout>
  );
}
