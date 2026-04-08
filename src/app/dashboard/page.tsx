import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Link2, BarChart3 } from "lucide-react";
import { CreateLinkDialog } from "./_components/create-link-dialog";
import { LinksTable, type SerializedLink } from "./_components/links-table";

export default async function DashboardPage() {
  const session = await auth();
  // layout.tsx already redirects unauthenticated users, but double-check for type safety
  if (!session?.user?.id) return null;

  const links = await prisma.link.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      url: true,
      title: true,
      tags: true,
      active: true,
      clickCount: true,
      clickLimit: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  // Serialize BigInt and Date fields so they can be passed to client components
  const serializedLinks: SerializedLink[] = links.map(
    (l: (typeof links)[number]) => ({
      id: l.id,
      slug: l.slug,
      url: l.url,
      title: l.title,
      tags: l.tags,
      active: l.active,
      clickCount: l.clickCount.toString(),
      clickLimit: l.clickLimit !== null ? l.clickLimit.toString() : null,
      expiresAt: l.expiresAt ? l.expiresAt.toISOString() : null,
      createdAt: l.createdAt.toISOString(),
    })
  );

  const totalClicks = links.reduce(
    (sum: bigint, l: (typeof links)[number]) => sum + l.clickCount,
    BigInt(0)
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage your short links and view analytics.
          </p>
        </div>
        <CreateLinkDialog />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
            <Link2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Total links
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {links.length.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Total clicks
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {Number(totalClicks).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Links table */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Your links
        </h2>
        <LinksTable links={serializedLinks} />
      </section>
    </div>
  );
}
