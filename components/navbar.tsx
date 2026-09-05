"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

interface NavbarProps {
  userEmail?: string | null;
  userName?: string | null;
}

export function Navbar({ userEmail, userName }: NavbarProps) {
  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-white font-semibold text-base tracking-tight">
            CitiusCloud Portal
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers/new"
            className="hidden sm:inline-flex text-sm text-gray-400 hover:text-white transition-colors"
          >
            + Add Account
          </Link>

          <div className="h-4 w-px bg-gray-700" />

          <div className="flex items-center gap-3">
            {(userName || userEmail) && (
              <div className="hidden sm:block text-right">
                {userName && (
                  <p className="text-white text-sm font-medium leading-none">{userName}</p>
                )}
                {userEmail && (
                  <p className="text-gray-500 text-xs mt-0.5">{userEmail}</p>
                )}
              </div>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
