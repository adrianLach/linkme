import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUser, unauthorized, forbidden, notFound } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ linkId: string }> };

type Granularity = "hour" | "day" | "week";

/** GET /api/v1/stats/:linkId/timeseries — clicks over time */
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
  const granularity = (searchParams.get("granularity") ?? "day") as Granularity;
  const validGranularities: Granularity[] = ["hour", "day", "week"];
  if (!validGranularities.includes(granularity)) {
    return Response.json(
      { error: "granularity must be one of: hour, day, week" },
      { status: 400 }
    );
  }

  // Default range: last 30 days
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const to = toParam ? new Date(toParam) : now;

  // Fetch visits within the date range
  const visits = await prisma.visit.findMany({
    where: {
      linkId,
      createdAt: { gte: from, lte: to },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Bucket visits by granularity
  const buckets = new Map<string, number>();

  for (const visit of visits) {
    const d = visit.createdAt;
    let key: string;
    if (granularity === "hour") {
      key = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours())
      ).toISOString();
    } else if (granularity === "week") {
      // ISO week Monday
      const day = d.getUTCDay();
      const diff = (day === 0 ? -6 : 1 - day);
      const monday = new Date(d);
      monday.setUTCDate(d.getUTCDate() + diff);
      monday.setUTCHours(0, 0, 0, 0);
      key = monday.toISOString();
    } else {
      key = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
      ).toISOString();
    }
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const series = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([timestamp, count]) => ({ timestamp, count }));

  return Response.json({ data: series });
}
