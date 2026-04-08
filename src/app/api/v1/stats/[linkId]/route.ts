import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUser, unauthorized, forbidden, notFound } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ linkId: string }> };

/** GET /api/v1/stats/:linkId — aggregate stats for a link */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();

  const { linkId } = await ctx.params;

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { id: true, userId: true, clickCount: true },
  });
  if (!link) return notFound();
  if (link.userId !== user.id && user.role !== "admin") return forbidden();

  const [uniqueCountries, uniqueBrowsers, uniqueDevices, recentVisits] =
    await Promise.all([
      prisma.visit.groupBy({
        by: ["country"],
        where: { linkId },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.visit.groupBy({
        by: ["browser"],
        where: { linkId },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.visit.groupBy({
        by: ["deviceType"],
        where: { linkId },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.visit.count({ where: { linkId } }),
    ]);

  return Response.json({
    data: {
      totalClicks: link.clickCount.toString(),
      totalVisitsLogged: recentVisits,
      topCountries: uniqueCountries.map((r: (typeof uniqueCountries)[number]) => ({
        country: r.country,
        count: r._count.id,
      })),
      topBrowsers: uniqueBrowsers.map((r: (typeof uniqueBrowsers)[number]) => ({
        browser: r.browser,
        count: r._count.id,
      })),
      topDevices: uniqueDevices.map((r: (typeof uniqueDevices)[number]) => ({
        deviceType: r.deviceType,
        count: r._count.id,
      })),
    },
  });
}
