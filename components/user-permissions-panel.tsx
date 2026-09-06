"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Customer, UserPermission } from "@/lib/dynamodb";

const ACCESS_TYPES = ["ReadOnly", "PowerUser", "Administrator", "Billing", "SecurityAudit"];

export function UserPermissionsPanel({
  permissions,
  customers,
}: {
  permissions: UserPermission[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    accountId: "",
    allowedRoles: ["ReadOnly"] as string[],
  });

  function toggleRole(role: string) {
    setForm((prev) => ({
      ...prev,
      allowedRoles: prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter((r) => r !== role)
        : [...prev.allowedRoles, role],
    }));
  }

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!form.allowedRoles.length) { setError("Select at least one role"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setForm({ email: "", accountId: "", allowedRoles: ["ReadOnly"] });
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(email: string, accountId: string, displayName: string) {
    if (!confirm(`Revoke access for ${email} to ${displayName}?`)) return;
    await fetch(`/api/permissions?email=${encodeURIComponent(email)}&accountId=${encodeURIComponent(accountId)}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  // Build a lookup for account display names
  const accountMap = new Map(customers.map((c) => [c.accountId, c]));

  const inputClass = "w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Team Access</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
            Control which team members can access which AWS accounts
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); }}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-md transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Grant Access
        </button>
      </div>

      {/* Grant access form */}
      {showForm && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">Grant Account Access</h2>
          <form onSubmit={handleGrant} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                Team Member Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
                placeholder="name@citiuscloud.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                AWS Account <span className="text-red-500">*</span>
              </label>
              <select
                value={form.accountId}
                onChange={(e) => setForm((p) => ({ ...p, accountId: e.target.value }))}
                required
                className={inputClass}
              >
                <option value="">Select an account...</option>
                {customers.map((c) => (
                  <option key={c.accountId} value={c.accountId}>
                    {c.name}{c.accountName ? ` — ${c.accountName}` : ""} ({c.accountId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Allowed Roles <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {ACCESS_TYPES.map((role) => {
                  const checked = form.allowedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                        checked
                          ? "bg-brand text-white border-brand"
                          : "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:border-gray-400"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {submitting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                {submitting ? "Granting..." : "Grant Access"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Permissions table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {permissions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">No permissions granted yet</p>
            <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">Click &quot;Grant Access&quot; to give a team member access to an account</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-800/60">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-500 px-6 py-3">Team Member</th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-500 px-6 py-3">Account</th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-500 px-6 py-3 hidden md:table-cell">Allowed Roles</th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-zinc-500 px-6 py-3 hidden lg:table-cell">Granted By</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {permissions.map((p) => {
                const account = accountMap.get(p.accountId);
                const displayName = account
                  ? `${account.name}${account.accountName ? ` — ${account.accountName}` : ""}`
                  : p.accountId;
                return (
                  <tr key={`${p.email}-${p.accountId}`} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-medium text-gray-900 dark:text-zinc-100">{p.email}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-gray-700 dark:text-zinc-300 text-sm">{displayName}</span>
                      <p className="text-xs font-mono text-gray-400 dark:text-zinc-600 mt-0.5">{p.accountId}</p>
                    </td>
                    <td className="px-6 py-3.5 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.allowedRoles.map((role) => (
                          <span key={role} className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-gray-500 dark:text-zinc-500">{p.grantedBy}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleRevoke(p.email, p.accountId, displayName)}
                        className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
