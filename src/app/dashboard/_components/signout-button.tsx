"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
