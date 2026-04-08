import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getApiUser, unauthorized } from "@/lib/api-auth";

const CreateLinkSchema = z.object({
  url: z.url(),
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-zA-Z0-9_-]+$/, "Slug must be alphanumeric, dashes, or underscores")
    .optional(),
  title: z.string().max(200).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  password: z.string().min(4).optional(),
  clickLimit: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
});

/** GET /api/v1/links — list authenticated user's links */
export async function GET(req: NextRequest) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const [links, total] = await Promise.all([
    prisma.link.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
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
        // omit password hash
      },
    }),
    prisma.link.count({ where: { userId: user.id } }),
  ]);

  return Response.json({
    data: links.map((l: typeof links[number]) => ({ ...l, clickCount: l.clickCount.toString() })),
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

/** POST /api/v1/links — create a new short link */
export async function POST(req: NextRequest) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { url, slug, title, tags, password, clickLimit, expiresAt } = parsed.data;

  // Use provided slug or generate one
  const finalSlug = slug ?? nanoid(7);

  // Check slug uniqueness
  const existing = await prisma.link.findUnique({ where: { slug: finalSlug } });
  if (existing) {
    return Response.json({ error: "Slug is already taken." }, { status: 409 });
  }

  const hashedPassword = password ? await bcrypt.hash(password, 12) : undefined;

  const link = await prisma.link.create({
    data: {
      userId: user.id,
      slug: finalSlug,
      url,
      title,
      tags: tags ?? [],
      password: hashedPassword,
      clickLimit: clickLimit ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
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

  return Response.json(
    { data: { ...link, clickCount: link.clickCount.toString() } },
    { status: 201 }
  );
}
