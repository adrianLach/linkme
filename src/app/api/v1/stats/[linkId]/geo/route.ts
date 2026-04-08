import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUser, unauthorized, forbidden, notFound } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ linkId: string }> };

/** GET /api/v1/stats/:linkId/geo — country/region/city breakdown */
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

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const [countries, regions, cities] = await Promise.all([
    prisma.visit.groupBy({
      by: ["country"],
      where: { linkId, country: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    }),
    prisma.visit.groupBy({
      by: ["region"],
      where: { linkId, region: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    }),
    prisma.visit.groupBy({
      by: ["city"],
      where: { linkId, city: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    }),
  ]);

  return Response.json({
    data: {
      countries: countries.map((r: (typeof countries)[number]) => ({ country: r.country, count: r._count.id })),
      regions: regions.map((r: (typeof regions)[number]) => ({ region: r.region, count: r._count.id })),
      cities: cities.map((r: (typeof cities)[number]) => ({ city: r.city, count: r._count.id })),
    },
  });
}
