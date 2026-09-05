"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Customer } from "@/lib/dynamodb";

type CustomerGroup = {
  name: string;
  accounts: Customer[];
};

export function CustomersList({ groups }: { groups: CustomerGroup[] }) {
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(groups.map((g) => g.name))
  );

  const filtered = search.trim()
    ? groups
        .map((g) => ({
          ...g,
          accounts: g.accounts.filter(
            (a) =>
              g.name.toLowerCase().includes(search.toLowerCase()) ||
              a.accountId.includes(search) ||
              (a.accountName ?? "").toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((g) => g.accounts.length > 0)
    : groups;

  function toggleGroup(name: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer, account name, or account ID..."
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl">
          <p className="text-gray-500 text-sm">No results for &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((group) => (
            <CustomerGroupSection
              key={group.name}
              group={group}
              isOpen={openGroups.has(group.name)}
              onToggle={() => toggleGroup(group.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerGroupSection({
  group,
  isOpen,
  onToggle,
}: {
  group: CustomerGroup;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const activeCount = group.accounts.filter((a) => a.status === "active").length;
  const initials = group.name.slice(0, 2).toUpperCase();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-orange-400 font-bold text-xs">{initials}</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{group.name}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {activeCount} active · {group.accounts.length} total
            </p>
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-950/60">
                  <th className="text-left text-xs text-gray-600 font-medium px-5 py-2.5 whitespace-nowrap">Account Name</th>
                  <th className="text-left text-xs text-gray-600 font-medium px-5 py-2.5 whitespace-nowrap">Account ID</th>
                  <th className="text-left text-xs text-gray-600 font-medium px-5 py-2.5 whitespace-nowrap hidden md:table-cell">Region</th>
                  <th className="text-left text-xs text-gray-600 font-medium px-5 py-2.5 whitespace-nowrap">Status</th>
                  <th className="text-right text-xs text-gray-600 font-medium px-5 py-2.5 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {group.accounts.map((account) => (
                  <AccountRow key={account.accountId} account={account} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
      if (!res.ok) {
        setError(data.error || "Failed to open console");
        return;
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete account ${account.accountName || account.accountId}?\n\nThis removes it from the portal only — the AWS account itself is not affected.`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers?accountId=${account.accountId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Delete failed");
        setDeleting(false);
      }
    } catch {
      setError("Network error");
      setDeleting(false);
    }
  }

  return (
    <tr className="hover:bg-gray-800/30 transition-colors">
      <td className="px-5 py-3.5">
        <span className="text-white font-medium">
          {account.accountName || <span className="text-gray-600 italic text-xs">—</span>}
        </span>
        {error && <p className="text-red-400 text-xs mt-0.5">{error}</p>}
      </td>
      <td className="px-5 py-3.5">
        <span className="text-gray-400 font-mono text-xs">{account.accountId}</span>
      </td>
      <td className="px-5 py-3.5 hidden md:table-cell">
        <span className="text-gray-500 text-xs">{account.region}</span>
      </td>
      <td className="px-5 py-3.5">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
            account.status === "active"
              ? "bg-green-500/10 text-green-400"
              : "bg-gray-700/50 text-gray-500"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              account.status === "active" ? "bg-green-400" : "bg-gray-500"
            }`}
          />
          {account.status}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={openConsole}
            disabled={loading || account.status !== "active"}
            className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
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
            {loading ? "Connecting..." : "Open Console"}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Remove from portal"
            className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-40"
          >
            {deleting ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
