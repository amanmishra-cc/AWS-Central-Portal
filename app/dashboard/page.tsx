import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listCustomers } from "@/lib/dynamodb";
import { Navbar } from "@/components/navbar";
import { CustomersList } from "@/components/customers-list";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const accounts = await listCustomers();

  // Group by customer name, sort alphabetically
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
  const totalCustomers = groups.length;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar userEmail={session.user?.email} userName={session.user?.name} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">AWS Account Management</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-gray-500 text-sm">
                <span className="text-white font-medium">{totalCustomers}</span> customers
              </span>
              <span className="text-gray-700">·</span>
              <span className="text-gray-500 text-sm">
                <span className="text-white font-medium">{totalAccounts}</span> accounts
              </span>
              <span className="text-gray-700">·</span>
              <span className="text-gray-500 text-sm">
                <span className="text-green-400 font-medium">{activeAccounts}</span> active
              </span>
            </div>
          </div>
          <a
            href="/admin/customers/new"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex-shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Account
          </a>
        </div>

        {/* Empty state */}
        {groups.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-2xl">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="h-7 w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <p className="text-gray-300 font-semibold">No customer accounts yet</p>
            <p className="text-gray-600 text-sm mt-1">Add your first AWS account to get started</p>
            <a
              href="/admin/customers/new"
              className="inline-flex mt-6 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
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
