import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "../../helpers";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    visit: { create: vi.fn() },
  },
}));

vi.mock("@/lib/geo", () => ({
  lookupGeo: vi.fn(),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { POST } from "@/app/api/internal/track/route";
import { prisma } from "@/lib/db";
import { lookupGeo } from "@/lib/geo";

const mockPrisma = vi.mocked(prisma);
const mockLookupGeo = vi.mocked(lookupGeo);

beforeEach(() => {
  vi.clearAllMocks();
  // Default: geo lookup returns empty
  mockLookupGeo.mockResolvedValue({});
});

describe("POST /api/internal/track", () => {
  it("returns 400 on invalid JSON body", async () => {
    const req = new Request("http://localhost/api/internal/track", {
      method: "POST",
      body: "not json",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 422 on missing required fields", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/internal/track", {
        method: "POST",
        body: { ip: "1.2.3.4" }, // missing linkId
      })
    );
    expect(res.status).toBe(422);
  });

  it("returns 422 on invalid linkId (not UUID)", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/internal/track", {
        method: "POST",
        body: { linkId: "not-a-uuid" },
      })
    );
    expect(res.status).toBe(422);
  });

  it("records a visit with geo and UA data", async () => {
    mockLookupGeo.mockResolvedValue({ country: "US", city: "New York", isp: "Comcast" });
    mockPrisma.visit.create.mockResolvedValue({} as never);

    const res = await POST(
      makeRequest("http://localhost/api/internal/track", {
        method: "POST",
        body: {
          linkId: "550e8400-e29b-41d4-a716-446655440000",
          ip: "8.8.8.8",
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          referer: "https://twitter.com",
          utmSource: "twitter",
          utmMedium: "social",
        },
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);

    expect(mockPrisma.visit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        linkId: "550e8400-e29b-41d4-a716-446655440000",
        ip: "8.8.8.8",
        country: "US",
        city: "New York",
        browser: "Chrome",
        referer: "https://twitter.com",
        utmSource: "twitter",
        utmMedium: "social",
      }),
    });
  });

  it("rejects requests with wrong secret when INTERNAL_API_SECRET is set", async () => {
    vi.stubEnv("INTERNAL_API_SECRET", "correct-secret");

    const res = await POST(
      makeRequest("http://localhost/api/internal/track", {
        method: "POST",
        body: { linkId: "550e8400-e29b-41d4-a716-446655440000" },
        headers: { "x-internal-secret": "wrong-secret" },
      })
    );
    expect(res.status).toBe(401);

    vi.unstubAllEnvs();
  });

  it("accepts requests with correct secret", async () => {
    vi.stubEnv("INTERNAL_API_SECRET", "correct-secret");
    mockLookupGeo.mockResolvedValue({});
    mockPrisma.visit.create.mockResolvedValue({} as never);

    const res = await POST(
      makeRequest("http://localhost/api/internal/track", {
        method: "POST",
        body: { linkId: "550e8400-e29b-41d4-a716-446655440000" },
        headers: { "x-internal-secret": "correct-secret" },
      })
    );
    expect(res.status).toBe(200);

    vi.unstubAllEnvs();
  });
});
