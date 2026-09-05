"use client";

import { useState } from "react";
import { Customer } from "@/lib/dynamodb";

export function CustomerCard({ customer }: { customer: Customer }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openConsole() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/console-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: customer.accountId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to open console");
        return;
      }

      // Open in new tab
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  const isActive = customer.status === "active";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-base truncate">{customer.name}</h3>
          <p className="text-gray-500 text-xs font-mono mt-0.5">{customer.accountId}</p>
        </div>
        <span
          className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
            isActive
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-gray-700/50 text-gray-500 border border-gray-700"
          }`}
        >
          {customer.status}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-sm">
        <div className="flex gap-2">
          <span className="text-gray-600 w-14 flex-shrink-0">Region</span>
          <span className="text-gray-300 font-mono text-xs">{customer.region}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-600 w-14 flex-shrink-0">Added</span>
          <span className="text-gray-300 text-xs">
            {new Date(customer.onboardedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        {customer.externalId && (
          <div className="flex gap-2">
            <span className="text-gray-600 w-14 flex-shrink-0">ExtID</span>
            <span className="text-gray-400 font-mono text-xs truncate">
              {customer.externalId.slice(0, 8)}...
            </span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Open Console button */}
      <button
        onClick={openConsole}
        disabled={loading || !isActive}
        className={`mt-auto w-full py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
          isActive
            ? "bg-orange-500 hover:bg-orange-600 text-white"
            : "bg-gray-800 text-gray-600 cursor-not-allowed"
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Connecting...
          </>
        ) : (
          <>
            Open AWS Console
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
