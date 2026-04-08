import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { slug } = await ctx.params;

  const link = await prisma.link.findUnique({
    where: { slug },
    select: {
      id: true,
      url: true,
      active: true,
      password: true,
      clickCount: true,
      clickLimit: true,
      expiresAt: true,
    },
  });

  if (!link || !link.active) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Check expiry
  if (link.expiresAt && link.expiresAt < new Date()) {
    return new NextResponse("This link has expired", { status: 410 });
  }

  // Check click limit
  if (link.clickLimit !== null && link.clickCount >= link.clickLimit) {
    return new NextResponse("This link has reached its click limit", { status: 410 });
  }

  // Password-protected link
  if (link.password) {
    const providedPassword = req.nextUrl.searchParams.get("password");
    if (!providedPassword) {
      // Redirect to the password prompt page
      const promptUrl = new URL(`/link-auth/${slug}`, req.url);
      return NextResponse.redirect(promptUrl, { status: 302 });
    }
    const valid = await bcrypt.compare(providedPassword, link.password);
    if (!valid) {
      const promptUrl = new URL(`/link-auth/${slug}?error=1`, req.url);
      return NextResponse.redirect(promptUrl, { status: 302 });
    }
  }

  // Increment click count atomically
  await prisma.link.update({
    where: { id: link.id },
    data: { clickCount: { increment: 1 } },
  });

  // Extract visit metadata
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;
  const referer = req.headers.get("referer") ?? undefined;
  const utmSource = req.nextUrl.searchParams.get("utm_source") ?? undefined;
  const utmMedium = req.nextUrl.searchParams.get("utm_medium") ?? undefined;
  const utmCampaign = req.nextUrl.searchParams.get("utm_campaign") ?? undefined;

  // Fire-and-forget visit tracking via the internal API
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const trackUrl = `${appUrl}/api/internal/track`;
  const secret = process.env.INTERNAL_API_SECRET;

  fetch(trackUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "x-internal-secret": secret } : {}),
    },
    body: JSON.stringify({
      linkId: link.id,
      ip,
      userAgent,
      referer,
      utmSource,
      utmMedium,
      utmCampaign,
    }),
  }).catch(() => {
    // Swallow errors — visit tracking must not break the redirect
  });

  return NextResponse.redirect(link.url, { status: 307 });
}
