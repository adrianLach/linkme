import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getApiUser, unauthorized, forbidden, notFound } from "@/lib/api-auth";

const UpdateLinkSchema = z.object({
  url: z.url().optional(),
  title: z.string().max(200).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  password: z.string().min(4).nullable().optional(),
  clickLimit: z.number().int().positive().nullable().optional(),
  expiresAt: z.iso.datetime().nullable().optional(),
  active: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/v1/links/:id */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();

  const { id } = await ctx.params;

  const link = await prisma.link.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      slug: true,
      url: true,
      title: true,
      tags: true,
      active: true,
      clickCount: true,
      clickLimit: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!link) return notFound();
  if (link.userId !== user.id && user.role !== "admin") return forbidden();

  return Response.json({
    data: { ...link, userId: undefined, clickCount: link.clickCount.toString() },
  });
}

/** PATCH /api/v1/links/:id */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();

  const { id } = await ctx.params;

  const link = await prisma.link.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!link) return notFound();
  if (link.userId !== user.id && user.role !== "admin") return forbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { url, title, tags, password, clickLimit, expiresAt, active } = parsed.data;

  // Only hash if a new password was provided; null means clear it
  let hashedPassword: string | null | undefined;
  if (password === null) {
    hashedPassword = null;
  } else if (password !== undefined) {
    hashedPassword = await bcrypt.hash(password, 12);
  }

  const updated = await prisma.link.update({
    where: { id },
    data: {
      ...(url !== undefined && { url }),
      ...(title !== undefined && { title }),
      ...(tags !== undefined && { tags }),
      ...(hashedPassword !== undefined && { password: hashedPassword }),
      ...(clickLimit !== undefined && { clickLimit: clickLimit }),
      ...(expiresAt !== undefined && {
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }),
      ...(active !== undefined && { active }),
    },
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
      updatedAt: true,
    },
  });

  return Response.json({
    data: { ...updated, clickCount: updated.clickCount.toString() },
  });
}

/** DELETE /api/v1/links/:id */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();

  const { id } = await ctx.params;

  const link = await prisma.link.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!link) return notFound();
  if (link.userId !== user.id && user.role !== "admin") return forbidden();

  await prisma.link.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
