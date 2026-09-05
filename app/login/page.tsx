"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const isDev = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [devEmail, setDevEmail] = useState("");

  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-300 dark:border-zinc-700 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!devEmail) return;
    setLoading(true);
    await signIn("credentials", { email: devEmail, callbackUrl: "/dashboard" });
  }

  async function handleCognitoLogin() {
    setLoading(true);
    await signIn("cognito", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-brand rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-base">C</span>
          </div>
          <span className="text-xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">
            CitiusCloud
          </span>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm">
          <h1 className="text-base font-semibold text-gray-900 dark:text-zinc-100 text-center mb-1">
            Sign in to your account
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-500 text-center mb-7">
            Internal AWS management portal
          </p>

          {isDev ? (
            <>
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2 mb-5">
                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Dev mode — any email works
              </div>
              <form onSubmit={handleDevLogin} className="space-y-3">
                <input
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="you@citiuscloud.in"
                  required
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading || !devEmail}
                  className="w-full bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  )}
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={handleCognitoLogin}
                disabled={loading}
                className="w-full bg-brand hover:bg-brand-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                {loading ? "Redirecting..." : "Sign in with Cognito"}
              </button>
              <p className="text-xs text-gray-400 dark:text-zinc-600 text-center mt-5">
                Contact your admin if you need access
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
