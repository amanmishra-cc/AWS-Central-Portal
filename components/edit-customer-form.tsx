"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Customer } from "@/lib/dynamodb";

const AWS_REGIONS = [
  "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "eu-west-1", "eu-central-1", "ca-central-1",
];

const ACCESS_TYPES = ["ReadOnly", "PowerUser", "Administrator", "Billing", "SecurityAudit", "Custom"];

export function EditCustomerForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: customer.name,
    accountName: customer.accountName || "",
    accessType: customer.accessType || "ReadOnly",
    roleArn: customer.roleArn,
    externalId: customer.externalId || "",
    region: customer.region,
    status: customer.status,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: customer.accountId,
          name: form.name,
          accountName: form.accountName || undefined,
          accessType: form.accessType || undefined,
          roleArn: form.roleArn,
          externalId: form.externalId || undefined,
          region: form.region,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Update failed"); return; }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5";

  return (
    <>
      <div className="mb-7">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors mb-5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </a>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Edit Account</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1 font-mono">{customer.accountId}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 space-y-5 shadow-sm"
      >
        <div>
          <label className={labelClass}>Customer Name <span className="text-red-500">*</span></label>
          <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Account Name <span className="text-gray-400 dark:text-zinc-600 font-normal">(optional)</span></label>
          <input name="accountName" value={form.accountName} onChange={handleChange} placeholder="e.g. Production, Development" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Access Type</label>
          <select name="accessType" value={form.accessType} onChange={handleChange} className={inputClass}>
            {ACCESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Role ARN <span className="text-red-500">*</span></label>
          <input name="roleArn" value={form.roleArn} onChange={handleChange} required className={`${inputClass} font-mono`} />
        </div>

        <div>
          <label className={labelClass}>External ID <span className="text-gray-400 dark:text-zinc-600 font-normal">(optional)</span></label>
          <input name="externalId" value={form.externalId} onChange={handleChange} className={`${inputClass} font-mono`} />
        </div>

        <div>
          <label className={labelClass}>Region</label>
          <select name="region" value={form.region} onChange={handleChange} className={inputClass}>
            {AWS_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
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
            {submitting ? "Saving..." : "Save Changes"}
          </button>
          <a
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </>
  );
}
