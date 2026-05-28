import { AdminClient } from "@/components/admin-client";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDashboardSummary } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [authorized, summary] = await Promise.all([
    isAdminAuthenticated(),
    Promise.resolve(getDashboardSummary())
  ]);

  return (
    <main className="page-shell">
      <AdminClient authorized={authorized} summary={summary} />
    </main>
  );
}
