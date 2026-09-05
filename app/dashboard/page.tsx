import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listCustomers } from "@/lib/dynamodb";
import { Navbar } from "@/components/navbar";
import { CustomerCard } from "@/components/customer-card";

export const dynamic = "force-dynamic"; // Always fetch fresh customer list

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const customers = await listCustomers();
  const activeCount = customers.filter((c) => c.status === "active").length;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar userEmail={session.user?.email} userName={session.user?.name} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Customer Accounts</h1>
            <p className="text-gray-500 text-sm mt-1">
              {activeCount} of {customers.length} accounts active
            </p>
          </div>
          <a
            href="/admin/customers/new"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Account
          </a>
        </div>

        {/* Customer grid */}
        {customers.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-2xl">
            <div className="text-gray-600 text-4xl mb-4">☁</div>
            <p className="text-gray-400 font-medium">No customer accounts yet</p>
            <p className="text-gray-600 text-sm mt-1">Add your first account to get started</p>
            <a
              href="/admin/customers/new"
              className="inline-flex mt-6 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Add Account
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((customer) => (
              <CustomerCard key={customer.accountId} customer={customer} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
