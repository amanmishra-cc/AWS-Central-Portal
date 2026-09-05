"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const isDev = process.env.NODE_ENV === "development";

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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading...</div>
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">CitiusCloud</span>
          </div>
          <p className="text-gray-400 text-sm">Internal AWS Management Portal</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-white text-xl font-semibold text-center mb-1">Team Sign In</h1>

          {isDev ? (
            // ── Dev login form ──────────────────────────────────────────────
            <>
              <p className="text-yellow-500/80 text-xs text-center mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg py-2 px-3">
                Dev mode — Cognito skipped. Any email works.
              </p>
              <form onSubmit={handleDevLogin} className="space-y-3">
                <input
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="you@citiuscloud.in"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={loading || !devEmail}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Sign in (Dev)"
                  )}
                </button>
              </form>
            </>
          ) : (
            // ── Production: Cognito ─────────────────────────────────────────
            <>
              <p className="text-gray-500 text-sm text-center mb-8">
                Use your CitiusCloud Cognito account
              </p>
              <button
                onClick={handleCognitoLogin}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Redirecting...
                  </>
                ) : (
                  "Sign in with Cognito"
                )}
              </button>
              <p className="text-gray-600 text-xs text-center mt-6">
                MFA enforced. Contact your admin if you need access.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
