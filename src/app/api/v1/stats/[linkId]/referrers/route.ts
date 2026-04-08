import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUser, unauthorized, forbidden, notFound } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ linkId: string }> };

/** GET /api/v1/stats/:linkId/referrers — referrer breakdown */
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

  const referrers = await prisma.visit.groupBy({
    by: ["referer"],
    where: { linkId, referer: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  return Response.json({
    data: referrers.map((r: (typeof referrers)[number]) => ({ referer: r.referer, count: r._count.id })),
  });
}
