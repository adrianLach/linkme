"use client";

import { useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { Link2, Lock } from "lucide-react";
import Link from "next/link";

export default function LinkAuthPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") === "1";

  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Navigate to the short link with the password as a query parameter
    window.location.href = `/${slug}?password=${encodeURIComponent(password)}`;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50"
      >
        <Link2 className="h-5 w-5 text-indigo-600" />
        link<span className="text-indigo-600">me</span>
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
            <Lock className="h-6 w-6 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Password Required
          </h1>
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            This link is password-protected. Enter the password to continue.
          </p>
        </div>

        {hasError && (
          <p className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">
            Incorrect password. Please try again.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
