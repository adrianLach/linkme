import { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { lookupGeo } from "@/lib/geo";

const TrackSchema = z.object({
  linkId: z.string().uuid(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  referer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

/**
 * POST /api/internal/track
 *
 * Internal endpoint called asynchronously by the redirect route to record a
 * visit. Not exposed to end-users — callers must supply the shared secret
 * via the `x-internal-secret` header when INTERNAL_API_SECRET is set.
 */
export async function POST(req: NextRequest) {
  // Optional shared secret guard (set INTERNAL_API_SECRET in env)
  const secret = process.env.INTERNAL_API_SECRET;
  if (secret) {
    const provided = req.headers.get("x-internal-secret");
    if (provided !== secret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = TrackSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { linkId, ip, userAgent, referer, utmSource, utmMedium, utmCampaign } =
    parsed.data;

  // Geo lookup (external HTTP call — run in parallel with UA parsing)
  const [geo, ua] = await Promise.all([
    lookupGeo(ip ?? ""),
    Promise.resolve(userAgent ? new UAParser(userAgent).getResult() : null),
  ]);

  await prisma.visit.create({
    data: {
      linkId,
      ip: ip ?? null,
      country: geo.country ?? null,
      region: geo.region ?? null,
      city: geo.city ?? null,
      isp: geo.isp ?? null,
      lat: geo.lat ?? null,
      lon: geo.lon ?? null,
      browser: ua?.browser.name ?? null,
      browserVer: ua?.browser.version ?? null,
      os: ua?.os.name ?? null,
      osVer: ua?.os.version ?? null,
      deviceType: ua?.device.type ?? "desktop",
      referer: referer ?? null,
      utmSource: utmSource ?? null,
      utmMedium: utmMedium ?? null,
      utmCampaign: utmCampaign ?? null,
    },
  });

  return Response.json({ ok: true });
}
