"use client";

import { useState, useMemo } from "react";
import { AuditEntry, Customer } from "@/lib/dynamodb";

export function AuditLogViewer({
  logs,
  customers,
}: {
  logs: AuditEntry[];
  customers: Customer[];
}) {
  const [search, setSearch] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterAccount, setFilterAccount] = useState("");

  const accountMap = new Map(customers.map((c) => [c.accountId, c]));

  const uniqueUsers = useMemo(
    () => Array.from(new Set(logs.map((l) => l.userId))).sort(),
    [logs]
  );

  const uniqueAccounts = useMemo(
    () => Array.from(new Set(logs.map((l) => l.customerId))).sort(),
    [logs]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((l) => {
      if (filterUser && l.userId !== filterUser) return false;
      if (filterAccount && l.customerId !== filterAccount) return false;
      if (q) {
        const account = accountMap.get(l.customerId);
        const accountLabel = account
          ? `${account.name} ${account.accountName || ""} ${l.customerId}`
          : l.customerId;
        if (
          !l.userId.toLowerCase().includes(q) &&
          !accountLabel.toLowerCase().includes(q) &&
          !l.action.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [logs, search, filterUser, filterAccount]);

  function formatTs(ts: string) {
    try {
      return new Date(ts).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return ts;
    }
  }

  const inputClass =
    "bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Audit Log</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
            Console access history — showing last {logs.length} events
          </p>
        </div>
        <span className="text-xs font-medium text-gray-400 dark:text-zinc-600 bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
          {filtered.length} of {logs.length}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search user, account, action..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} flex-1 min-w-48`}
        />
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className={inputClass}
        >
          <option value="">All users</option>
          {uniqueUsers.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className={inputClass}
        >
          <option value="">All accounts</option>
          {uniqueAccounts.map((id) => {
            const a = accountMap.get(id);
            return (
              <option key={id} value={id}>
                {a ? `${a.name}${a.accountName ? ` — ${a.accountName}` : ""}` : id}
              </option>
            );
          })}
        </select>
        {(search || filterUser || filterAccount) && (
          <button
            onClick={() => { setSearch(""); setFilterUser(""); setFilterAccount(""); }}
            className="text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">No audit events found</p>
            <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">
              {logs.length === 0 ? "Console access events will appear here" : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800/60">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-500 px-6 py-3">Timestamp</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-500 px-6 py-3">Team Member</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-500 px-6 py-3">Account</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-500 px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                {filtered.map((log) => {
                  const account = accountMap.get(log.customerId);
                  const accountLabel = account
                    ? `${account.name}${account.accountName ? ` — ${account.accountName}` : ""}`
                    : log.customerId;
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-mono text-gray-500 dark:text-zinc-400">
                          {formatTs(log.timestamp)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-medium text-gray-900 dark:text-zinc-100">{log.userId}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-gray-700 dark:text-zinc-300">{accountLabel}</span>
                        <p className="text-xs font-mono text-gray-400 dark:text-zinc-600 mt-0.5">{log.customerId}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400">
                          {log.action}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
