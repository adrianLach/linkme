import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Link2, LayoutDashboard } from "lucide-react";
import { SignOutButton } from "./_components/signout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          {/* Logo + nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              <Link2 className="h-5 w-5 text-indigo-600" />
              link<span className="text-indigo-600">me</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </nav>
          </div>

          {/* User info + sign out */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-zinc-500 dark:text-zinc-400">
              {session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
