import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUser, unauthorized, forbidden, notFound } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ linkId: string }> };

/** GET /api/v1/stats/:linkId/devices — browser/OS/device breakdown */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();

  const { linkId } = await ctx.params;

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { id: true, userId: true },
  });
  if (!link) return notFound();
  if (link.userId !== user.id && user.role !== "admin") return forbidden();

  const [browsers, operatingSystems, deviceTypes] = await Promise.all([
    prisma.visit.groupBy({
      by: ["browser"],
      where: { linkId, browser: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    }),
    prisma.visit.groupBy({
      by: ["os"],
      where: { linkId, os: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    }),
    prisma.visit.groupBy({
      by: ["deviceType"],
      where: { linkId, deviceType: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
  ]);

  return Response.json({
    data: {
      browsers: browsers.map((r: (typeof browsers)[number]) => ({ browser: r.browser, count: r._count.id })),
      operatingSystems: operatingSystems.map((r: (typeof operatingSystems)[number]) => ({
        os: r.os,
        count: r._count.id,
      })),
      deviceTypes: deviceTypes.map((r: (typeof deviceTypes)[number]) => ({
        deviceType: r.deviceType,
        count: r._count.id,
      })),
    },
  });
}
