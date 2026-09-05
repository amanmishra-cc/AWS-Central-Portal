"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Customer } from "@/lib/dynamodb";

type CustomerGroup = {
  name: string;
  accounts: Customer[];
};

export function CustomersList({ groups }: { groups: CustomerGroup[] }) {
  const [selected, setSelected] = useState<string>(groups[0]?.name ?? "");
  const [search, setSearch] = useState("");

  const filteredGroups = search.trim()
    ? groups.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.accounts.some(
            (a) =>
              a.accountId.includes(search) ||
              (a.accountName ?? "").toLowerCase().includes(search.toLowerCase())
          )
      )
    : groups;

  const activeGroup = groups.find((g) => g.name === selected) ?? groups[0];

  return (
    <div className="flex h-[calc(100vh-7rem)] border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-gray-200 dark:border-zinc-800 flex flex-col">
        <div className="p-3 border-b border-gray-200 dark:border-zinc-800">
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-100 dark:bg-zinc-800 border-0 rounded-md text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-1">
          {filteredGroups.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-zinc-600 text-center py-6">No results</p>
          ) : (
            filteredGroups.map((group) => {
              const active = group.accounts.filter((a) => a.status === "active").length;
              const isSelected = group.name === selected;
              return (
                <button
                  key={group.name}
                  onClick={() => setSelected(group.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? "bg-orange-50 dark:bg-orange-500/10 text-brand"
                      : "text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                        isSelected
                          ? "bg-brand text-white"
                          : "bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400"
                      }`}
                    >
                      {group.name[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate">{group.name}</span>
                  </div>
                  <span className={`text-xs flex-shrink-0 ml-1 ${isSelected ? "text-brand/70" : "text-gray-400 dark:text-zinc-600"}`}>
                    {active}/{group.accounts.length}
                  </span>
                </button>
              );
            })
          )}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-zinc-800">
          <a
            href="/admin/customers/new"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Account
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeGroup ? (
          <>
            {/* Customer header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                  {activeGroup.name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                  {activeGroup.accounts.filter((a) => a.status === "active").length} active ·{" "}
                  {activeGroup.accounts.length} total accounts
                </p>
              </div>
              <a
                href="/admin/customers/new"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-md transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Account
              </a>
            </div>

            {/* Accounts table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 dark:bg-zinc-800/60 z-[1]">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-500 px-6 py-3">
                      Account Name
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-500 px-6 py-3">
                      Account ID
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-500 px-6 py-3 hidden lg:table-cell">
                      Region
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-500 px-6 py-3">
                      Status
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                  {activeGroup.accounts.map((account) => (
                    <AccountRow key={account.accountId} account={account} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-zinc-600">Select a customer</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountRow({ account }: { account: Customer }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openConsole() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/console-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: account.accountId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove "${account.accountName || account.accountId}" from the portal?\n\nThe AWS account itself will not be affected.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers?accountId=${account.accountId}`, { method: "DELETE" });
      if (res.ok) { router.refresh(); return; }
      const data = await res.json();
      setError(data.error || "Delete failed");
    } catch {
      setError("Network error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors">
      <td className="px-6 py-3.5">
        <span className="font-medium text-gray-900 dark:text-zinc-100">
          {account.accountName || <span className="text-gray-400 dark:text-zinc-600 font-normal">—</span>}
        </span>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </td>
      <td className="px-6 py-3.5">
        <span className="font-mono text-xs text-gray-500 dark:text-zinc-400">{account.accountId}</span>
      </td>
      <td className="px-6 py-3.5 hidden lg:table-cell">
        <span className="text-xs text-gray-500 dark:text-zinc-500">{account.region}</span>
      </td>
      <td className="px-6 py-3.5">
        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
          account.status === "active"
            ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
            : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${account.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
          {account.status}
        </span>
      </td>
      <td className="px-6 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={openConsole}
            disabled={loading || account.status !== "active"}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            {loading ? (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
            {loading ? "Opening..." : "Open Console"}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Remove account"
            className="p-1.5 text-gray-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-40"
          >
            {deleting ? (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
