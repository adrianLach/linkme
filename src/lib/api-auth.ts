import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface ApiUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Resolves the caller identity from either:
 *  - A NextAuth session cookie (browser clients)
 *  - An `Authorization: Bearer <apiKey>` header (programmatic access)
 *
 * Returns the user object or `null` when unauthenticated.
 */
export async function getApiUser(req: NextRequest): Promise<ApiUser | null> {
  // 1. Try API key from Authorization header
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const key = authHeader.slice(7).trim();
    if (key) {
      const user = await prisma.user.findUnique({
        where: { apiKey: key },
        select: { id: true, email: true, role: true },
      });
      if (user) return user;
    }
  }

  // 2. Fall back to session auth
  const session = await auth();
  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email ?? "",
      role: (session.user as { role?: string }).role ?? "user",
    };
  }

  return null;
}

/** Convenience: return a 401 JSON response */
export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

/** Convenience: return a 403 JSON response */
export function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

/** Convenience: return a 404 JSON response */
export function notFound() {
  return Response.json({ error: "Not found" }, { status: 404 });
}
