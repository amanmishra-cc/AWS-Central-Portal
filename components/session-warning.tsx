"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

const WARN_BEFORE_MS = 15 * 60 * 1000; // warn 15 mins before expiry

export function SessionWarning() {
  const { data: session } = useSession();
  const [minsLeft, setMinsLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!session?.expires) return;

    function check() {
      const expiresAt = new Date(session!.expires).getTime();
      const remaining = expiresAt - Date.now();
      if (remaining <= WARN_BEFORE_MS && remaining > 0) {
        setMinsLeft(Math.ceil(remaining / 60000));
        setDismissed(false);
      } else {
        setMinsLeft(null);
      }
    }

    check();
    const id = setInterval(check, 30000); // re-check every 30s
    return () => clearInterval(id);
  }, [session]);

  if (!minsLeft || dismissed) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 px-5 py-2.5 flex items-center gap-3">
      <svg className="h-4 w-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-sm text-amber-700 dark:text-amber-400 flex-1">
        Your session expires in <span className="font-semibold">{minsLeft} minute{minsLeft !== 1 ? "s" : ""}</span>.
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => signIn()}
          className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 underline underline-offset-2 transition-colors"
        >
          Sign in again
        </button>
        <span className="text-amber-300 dark:text-amber-700">|</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 underline underline-offset-2 transition-colors"
        >
          Sign out
        </button>
        <span className="text-amber-300 dark:text-amber-700">|</span>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
