import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUser, unauthorized, forbidden, notFound } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ linkId: string }> };

/** GET /api/v1/stats/:linkId/visits — paginated raw visit log */
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
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const skip = (page - 1) * limit;

  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      where: { linkId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        ip: true,
        country: true,
        region: true,
        city: true,
        isp: true,
        lat: true,
        lon: true,
        browser: true,
        browserVer: true,
        os: true,
        osVer: true,
        deviceType: true,
        referer: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        createdAt: true,
      },
    }),
    prisma.visit.count({ where: { linkId } }),
  ]);

  return Response.json({
    data: visits.map((v: (typeof visits)[number]) => ({ ...v, id: v.id.toString() })),
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}
