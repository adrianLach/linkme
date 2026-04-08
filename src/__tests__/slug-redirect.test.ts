import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { MOCK_LINK } from "./helpers";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    link: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock global fetch so visit tracking doesn't make real HTTP calls
const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
vi.stubGlobal("fetch", mockFetch);

// ── Import after mocks ────────────────────────────────────────────────────────

import { GET } from "@/app/[slug]/route";
import { prisma } from "@/lib/db";

const mockPrisma = vi.mocked(prisma);

const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) });

function makeSlugRequest(slug: string, params?: Record<string, string>): NextRequest {
  const url = new URL(`http://localhost/${slug}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(url);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true })));
});

// ── GET /[slug] ───────────────────────────────────────────────────────────────

describe("GET /[slug]", () => {
  it("returns 404 when slug does not exist", async () => {
    mockPrisma.link.findUnique.mockResolvedValue(null as never);
    const res = await GET(makeSlugRequest("missing"), ctx("missing"));
    expect(res.status).toBe(404);
  });

  it("returns 404 when link is inactive", async () => {
    mockPrisma.link.findUnique.mockResolvedValue({ ...MOCK_LINK, active: false } as never);
    const res = await GET(makeSlugRequest("abc1234"), ctx("abc1234"));
    expect(res.status).toBe(404);
  });

  it("returns 410 when link has expired", async () => {
    const pastDate = new Date(Date.now() - 1000);
    mockPrisma.link.findUnique.mockResolvedValue({
      ...MOCK_LINK,
      expiresAt: pastDate,
    } as never);
    const res = await GET(makeSlugRequest("abc1234"), ctx("abc1234"));
    expect(res.status).toBe(410);
  });

  it("returns 410 when click limit is reached", async () => {
    mockPrisma.link.findUnique.mockResolvedValue({
      ...MOCK_LINK,
      clickCount: BigInt(10),
      clickLimit: BigInt(10),
    } as never);
    const res = await GET(makeSlugRequest("abc1234"), ctx("abc1234"));
    expect(res.status).toBe(410);
  });

  it("redirects to password prompt when link is password-protected and no password provided", async () => {
    mockPrisma.link.findUnique.mockResolvedValue({
      ...MOCK_LINK,
      password: "$2b$12$hashedpassword",
    } as never);
    const res = await GET(makeSlugRequest("abc1234"), ctx("abc1234"));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/link-auth/abc1234");
  });

  it("redirects to error page on wrong password", async () => {
    mockPrisma.link.findUnique.mockResolvedValue({
      ...MOCK_LINK,
      // bcrypt hash of "wrongpassword" will never match "bad"
      password: "$2b$12$invalidhashinvalidhashinvalidhashinvalidhashinval",
    } as never);
    const res = await GET(makeSlugRequest("abc1234", { password: "bad" }), ctx("abc1234"));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("error=1");
  });

  it("returns 307 redirect for a valid unprotected link", async () => {
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);
    mockPrisma.link.update.mockResolvedValue(MOCK_LINK as never);

    const res = await GET(makeSlugRequest("abc1234"), ctx("abc1234"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://example.com/");
  });

  it("increments click count on successful redirect", async () => {
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);
    mockPrisma.link.update.mockResolvedValue(MOCK_LINK as never);

    await GET(makeSlugRequest("abc1234"), ctx("abc1234"));

    expect(mockPrisma.link.update).toHaveBeenCalledWith({
      where: { id: "link-1" },
      data: { clickCount: { increment: 1 } },
    });
  });

  it("fires async visit tracking on successful redirect", async () => {
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);
    mockPrisma.link.update.mockResolvedValue(MOCK_LINK as never);

    const req = new NextRequest("http://localhost/abc1234", {
      headers: {
        "user-agent": "Mozilla/5.0 Chrome/120",
        "referer": "https://twitter.com",
      },
    });
    await GET(req, ctx("abc1234"));

    // Give the fire-and-forget fetch a tick to initiate
    await new Promise((r) => setTimeout(r, 0));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/internal/track"),
      expect.objectContaining({ method: "POST" })
    );
  });
});
