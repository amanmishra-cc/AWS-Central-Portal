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
    accountId: "",
    roleArn: "",
    externalId: "",
    region: "ap-south-1",
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (!session) {
    redirect("/login");
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // Auto-fill Role ARN when account ID is entered
  function handleAccountIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const accountId = e.target.value;
    setForm((prev) => ({
      ...prev,
      accountId,
      roleArn:
        accountId.length === 12
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
          accountId: form.accountId,
          roleArn: form.roleArn,
          externalId: form.externalId || undefined,
          region: form.region,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Failed to add customer");
        return;
      }

      router.push("/dashboard");
    } catch {
      setServerError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar userEmail={session?.user?.email} userName={session?.user?.name} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <a
            href="/dashboard"
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors inline-flex items-center gap-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </a>
          <h1 className="text-2xl font-bold text-white mt-4">Add Customer Account</h1>
          <p className="text-gray-500 text-sm mt-1">
            The customer must have already deployed the CitiusCloud IAM role in their account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5"
        >
          {/* Customer name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Customer Name <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Ekishwar"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm"
            />
          </div>

          {/* AWS Account ID */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              AWS Account ID <span className="text-red-400">*</span>
            </label>
            <input
              name="accountId"
              value={form.accountId}
              onChange={handleAccountIdChange}
              required
              placeholder="123456789012"
              pattern="\d{12}"
              title="Must be a 12-digit AWS account number"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm font-mono"
            />
          </div>

          {/* Role ARN */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Role ARN <span className="text-red-400">*</span>
            </label>
            <input
              name="roleArn"
              value={form.roleArn}
              onChange={handleChange}
              required
              placeholder="arn:aws:iam::123456789012:role/CitiusCloud-ReadOnly"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm font-mono"
            />
            <p className="text-gray-600 text-xs mt-1">
              Auto-filled when you enter the Account ID
            </p>
          </div>

          {/* External ID */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              External ID{" "}
              <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <input
              name="externalId"
              value={form.externalId}
              onChange={handleChange}
              placeholder="Leave blank if the IAM role has no ExternalId condition"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm font-mono"
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Primary Region
            </label>
            <select
              name="region"
              value={form.region}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 text-sm"
            >
              {AWS_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {serverError && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {serverError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Adding...
              </>
            ) : (
              "Add Customer Account"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
