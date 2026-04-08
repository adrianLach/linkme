import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Globe,
  Monitor,
  Smartphone,
  Users,
  ExternalLink,
  Activity,
} from "lucide-react";

type RouteContext = { params: Promise<{ id: string }> };

export default async function LinkStatsPage({ params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const { id } = await params;

  // Fetch the link and verify ownership
  const link = await prisma.link.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      url: true,
      title: true,
      active: true,
      clickCount: true,
      clickLimit: true,
      expiresAt: true,
      createdAt: true,
      userId: true,
    },
  });

  if (!link) notFound();

  const role = (session.user as { role?: string }).role ?? "user";
  if (link.userId !== session.user.id && role !== "admin") notFound();

  // Fetch analytics in parallel
  const [topCountries, topBrowsers, topDevices, recentVisits, totalVisits] =
    await Promise.all([
      prisma.visit.groupBy({
        by: ["country"],
        where: { linkId: id },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.visit.groupBy({
        by: ["browser"],
        where: { linkId: id },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.visit.groupBy({
        by: ["deviceType"],
        where: { linkId: id },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.visit.findMany({
        where: { linkId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          ip: true,
          country: true,
          city: true,
          browser: true,
          os: true,
          deviceType: true,
          referer: true,
          createdAt: true,
        },
      }),
      prisma.visit.count({ where: { linkId: id } }),
    ]);

  return (
    <div className="space-y-8">
      {/* Back + header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              /{link.slug}
            </h1>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 transition-colors"
            >
              {link.url.length > 80 ? link.url.slice(0, 80) + "…" : link.url}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <span
            className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ${
              link.active
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
            }`}
          >
            {link.active ? "Active" : "Disabled"}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<BarChart3 className="h-5 w-5 text-indigo-600" />}
          label="Total clicks"
          value={Number(link.clickCount).toLocaleString()}
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-indigo-600" />}
          label="Visits logged"
          value={totalVisits.toLocaleString()}
        />
        <StatCard
          icon={<Globe className="h-5 w-5 text-indigo-600" />}
          label="Countries"
          value={topCountries.filter((c: { country: string | null }) => c.country).length.toLocaleString()}
        />
      </div>

      {/* Analytics tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top countries */}
        <BreakdownCard
          title="Top countries"
          icon={<Globe className="h-4 w-4" />}
          rows={topCountries.map((r: { country: string | null; _count: { id: number } }) => ({
            label: r.country ?? "Unknown",
            count: r._count.id,
          }))}
          total={totalVisits}
        />

        {/* Browsers */}
        <BreakdownCard
          title="Browsers"
          icon={<Monitor className="h-4 w-4" />}
          rows={topBrowsers.map((r: { browser: string | null; _count: { id: number } }) => ({
            label: r.browser ?? "Unknown",
            count: r._count.id,
          }))}
          total={totalVisits}
        />

        {/* Devices */}
        <BreakdownCard
          title="Devices"
          icon={<Smartphone className="h-4 w-4" />}
          rows={topDevices.map((r: { deviceType: string | null; _count: { id: number } }) => ({
            label: capitalize(r.deviceType ?? "Unknown"),
            count: r._count.id,
          }))}
          total={totalVisits}
        />
      </div>

      {/* Recent visits */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-500" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Recent visits
          </h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          {recentVisits.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No visits recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    {[
                      "Time",
                      "Country",
                      "City",
                      "Browser",
                      "OS",
                      "Device",
                      "Referrer",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {recentVisits.map(
                    (v: {
                      id: bigint;
                      ip: string | null;
                      country: string | null;
                      city: string | null;
                      browser: string | null;
                      os: string | null;
                      deviceType: string | null;
                      referer: string | null;
                      createdAt: Date;
                    }) => (
                      <tr
                        key={v.id.toString()}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {new Date(v.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                          {v.country ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                          {v.city ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                          {v.browser ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                          {v.os ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                          {capitalize(v.deviceType ?? "—")}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                          {v.referer ? (
                            <span title={v.referer}>
                              {v.referer.length > 40
                                ? v.referer.slice(0, 40) + "…"
                                : v.referer}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ── Small helper components ────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
        {icon}
      </div>
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {value}
        </p>
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  icon,
  rows,
  total,
}: {
  title: string;
  icon: React.ReactNode;
  rows: { label: string; count: number }[];
  total: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
        {icon}
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">
          {title}
        </h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
            return (
              <li key={row.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {row.label}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {row.count.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-1.5 rounded-full bg-indigo-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
