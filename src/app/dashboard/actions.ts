"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | { success: true };

export async function createLinkAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const url = (formData.get("url") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
  const title = (formData.get("title") as string | null)?.trim() || undefined;
  const password = (formData.get("password") as string | null)?.trim() || undefined;

  if (!url) return { error: "URL is required." };

  try {
    new URL(url);
  } catch {
    return { error: "Please enter a valid URL (including https://)." };
  }

  const slug = slugRaw || nanoid(7);

  if (slugRaw && !/^[a-zA-Z0-9_-]+$/.test(slugRaw)) {
    return {
      error:
        "Slug may only contain letters, numbers, dashes, and underscores.",
    };
  }

  const existing = await prisma.link.findUnique({ where: { slug } });
  if (existing) return { error: "That slug is already taken." };

  const hashedPassword = password ? await bcrypt.hash(password, 12) : undefined;

  await prisma.link.create({
    data: {
      userId: session.user.id,
      slug,
      url,
      title,
      password: hashedPassword,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteLinkAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const link = await prisma.link.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!link) return { error: "Link not found." };

  const role = (session.user as { role?: string }).role ?? "user";
  if (link.userId !== session.user.id && role !== "admin") {
    return { error: "Forbidden" };
  }

  await prisma.link.delete({ where: { id } });
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleLinkAction(
  id: string,
  active: boolean
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const link = await prisma.link.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!link) return { error: "Link not found." };

  const role = (session.user as { role?: string }).role ?? "user";
  if (link.userId !== session.user.id && role !== "admin") {
    return { error: "Forbidden" };
  }

  await prisma.link.update({ where: { id }, data: { active } });
  revalidatePath("/dashboard");
  return { success: true };
}
