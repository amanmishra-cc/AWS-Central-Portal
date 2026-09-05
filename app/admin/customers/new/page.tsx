"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

const AWS_REGIONS = [
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "ca-central-1",
];

export default function NewCustomerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    accountName: "",
    accessType: "ReadOnly",
    accountId: "",
    roleArn: "",
    externalId: "",
    region: "ap-south-1",
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-300 dark:border-zinc-700 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) redirect("/login");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleAccountIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const accountId = e.target.value;
    setForm((prev) => ({
      ...prev,
      accountId,
      roleArn: accountId.length === 12
        ? `arn:aws:iam::${accountId}:role/CitiusCloud-ReadOnly`
        : prev.roleArn,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          accountName: form.accountName || undefined,
          accessType: form.accessType || undefined,
          accountId: form.accountId,
          roleArn: form.roleArn,
          externalId: form.externalId || undefined,
          region: form.region,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error || "Failed to add account"); return; }
      router.push("/dashboard");
    } catch {
      setServerError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <Navbar userEmail={session?.user?.email} userName={session?.user?.name} />

      <main className="max-w-lg mx-auto px-4 py-10">
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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Add Customer Account</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
            The CitiusCloud IAM role must already be deployed in the customer account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 space-y-5 shadow-sm"
        >
          <div>
            <label className={labelClass}>
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Ekishwar — groups all their accounts"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Account Name <span className="text-gray-400 dark:text-zinc-600 font-normal">(optional)</span>
            </label>
            <input
              name="accountName"
              value={form.accountName}
              onChange={handleChange}
              placeholder="e.g. Production, Development, Staging"
              className={inputClass}
            />
            <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">Friendly label for this specific AWS account</p>
          </div>

          <div>
            <label className={labelClass}>Access Type</label>
            <select name="accessType" value={form.accessType} onChange={handleChange} className={inputClass}>
              <option value="ReadOnly">ReadOnly</option>
              <option value="PowerUser">PowerUser</option>
              <option value="Administrator">Administrator</option>
              <option value="Billing">Billing</option>
              <option value="SecurityAudit">SecurityAudit</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>
              AWS Account ID <span className="text-red-500">*</span>
            </label>
            <input
              name="accountId"
              value={form.accountId}
              onChange={handleAccountIdChange}
              required
              placeholder="123456789012"
              pattern="\d{12}"
              title="Must be a 12-digit AWS account number"
              className={`${inputClass} font-mono`}
            />
          </div>

          <div>
            <label className={labelClass}>
              Role ARN <span className="text-red-500">*</span>
            </label>
            <input
              name="roleArn"
              value={form.roleArn}
              onChange={handleChange}
              required
              placeholder="arn:aws:iam::123456789012:role/CitiusCloud-ReadOnly"
              className={`${inputClass} font-mono`}
            />
            <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">Auto-filled when you enter the Account ID</p>
          </div>

          <div>
            <label className={labelClass}>
              External ID <span className="text-gray-400 dark:text-zinc-600 font-normal">(optional)</span>
            </label>
            <input
              name="externalId"
              value={form.externalId}
              onChange={handleChange}
              placeholder="Leave blank if the role has no ExternalId condition"
              className={`${inputClass} font-mono`}
            />
          </div>

          <div>
            <label className={labelClass}>Region</label>
            <select
              name="region"
              value={form.region}
              onChange={handleChange}
              className={inputClass}
            >
              {AWS_REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {serverError && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {submitting ? "Adding..." : "Add Account"}
          </button>
        </form>
      </main>
    </div>
  );
}
