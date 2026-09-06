import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listAuditLogs, listCustomers } from "@/lib/dynamodb";
import { isAdmin } from "@/lib/is-admin";
import { Navbar } from "@/components/navbar";
import { AuditLogViewer } from "@/components/audit-log-viewer";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!isAdmin(session.user?.email)) redirect("/dashboard");

  const [logs, customers] = await Promise.all([
    listAuditLogs(500),
    listCustomers(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <Navbar userEmail={session.user?.email} userName={session.user?.name} isAdmin />
      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-6">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </a>
        </div>
        <AuditLogViewer logs={logs} customers={customers} />
      </main>
    </div>
  );
}
