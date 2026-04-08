import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { getApiUser, unauthorized } from "@/lib/api-auth";

/** POST /api/v1/user/api-key — generate (or regenerate) an API key */
export async function POST(req: NextRequest) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();

  // Generate a new API key: "lm_" prefix + 32 random chars
  const newKey = `lm_${nanoid(32)}`;

  await prisma.user.update({
    where: { id: user.id },
    data: { apiKey: newKey },
  });

  // Return the plain-text key — this is the only time it will be shown
  return Response.json({ data: { apiKey: newKey } }, { status: 201 });
}

/** DELETE /api/v1/user/api-key — revoke the API key */
export async function DELETE(req: NextRequest) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();

  await prisma.user.update({
    where: { id: user.id },
    data: { apiKey: null },
  });

  return new Response(null, { status: 204 });
}
