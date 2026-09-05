import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listCustomers } from "@/lib/dynamodb";
import { Navbar } from "@/components/navbar";
import { CustomersList } from "@/components/customers-list";
import { SessionWarning } from "@/components/session-warning";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const accounts = await listCustomers();

  const groupMap = new Map<string, typeof accounts>();
  for (const account of accounts) {
    if (!groupMap.has(account.name)) groupMap.set(account.name, []);
    groupMap.get(account.name)!.push(account);
  }
  const groups = Array.from(groupMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, accts]) => ({
      name,
      accounts: accts.sort((a, b) =>
        (a.accountName || a.accountId).localeCompare(b.accountName || b.accountId)
      ),
    }));

  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((a) => a.status === "active").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col">
      <Navbar userEmail={session.user?.email} userName={session.user?.name} />
      <SessionWarning />

      <main className="flex-1 flex flex-col px-5 py-5 gap-4 max-w-screen-xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
              AWS Accounts
            </h1>
            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
              {groups.length} customers · {activeAccounts} of {totalAccounts} accounts active
            </p>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg">
            <svg className="h-10 w-10 text-gray-300 dark:text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">No accounts yet</p>
            <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1 mb-5">Add your first customer AWS account to get started</p>
            <a
              href="/admin/customers/new"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-md transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Account
            </a>
          </div>
        ) : (
          <CustomersList groups={groups} />
        )}
      </main>
    </div>
  );
}
