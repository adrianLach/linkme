/**
 * Shared test helpers for API route unit tests.
 *
 * Route handlers are called directly (no HTTP server needed). Dependencies
 * (Prisma, auth, geo) are mocked at the module level in each test file using
 * Vitest's `vi.mock`.
 */
import { NextRequest } from "next/server";

/** Build a NextRequest with optional JSON body / headers / search params. */
export function makeRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = "GET", body, headers = {} } = options;
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    (headers as Record<string, string>)["content-type"] = "application/json";
  }
  return new NextRequest(url, init);
}

/** A stub for an authenticated user. */
export const MOCK_USER = {
  id: "user-1",
  email: "test@example.com",
  role: "user",
};

/** A stub for an admin user. */
export const MOCK_ADMIN = {
  id: "admin-1",
  email: "admin@example.com",
  role: "admin",
};

/** A realistic mock link. */
export const MOCK_LINK = {
  id: "link-1",
  userId: "user-1",
  slug: "abc1234",
  url: "https://example.com",
  title: "Example",
  tags: [],
  active: true,
  password: null,
  clickCount: BigInt(42),
  clickLimit: null,
  expiresAt: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};
