"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

interface NavbarProps {
  userEmail?: string | null;
  userName?: string | null;
  isAdmin?: boolean;
}

export function Navbar({ userEmail, userName, isAdmin }: NavbarProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    setDark(isDark);
    try { localStorage.setItem("theme", isDark ? "dark" : "light"); } catch {}
  }

  const displayName = userName || userEmail?.split("@")[0] || "User";

  return (
    <header className="h-14 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center px-5 gap-4 sticky top-0 z-10">
      <Link href="/dashboard" className="flex items-center gap-2.5 mr-auto">
        <div className="w-7 h-7 bg-brand rounded-md flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xs">C</span>
        </div>
        <span className="font-semibold text-gray-900 dark:text-zinc-100 text-sm tracking-tight">
          CitiusCloud Portal
        </span>
      </Link>

      {isAdmin && (
        <Link
          href="/admin/users"
          className="text-xs font-medium text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          Team Access
        </Link>
      )}

      <button
        onClick={toggleTheme}
        className="p-1.5 rounded-md text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        title="Toggle theme"
      >
        {dark ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <div className="h-5 w-px bg-gray-200 dark:bg-zinc-700" />

      <span className="text-sm text-gray-600 dark:text-zinc-400 hidden sm:block">
        {displayName}
      </span>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-sm text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
      >
        Sign out
      </button>
    </header>
  );
}
