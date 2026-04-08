import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest, MOCK_USER, MOCK_LINK } from "../../../../helpers";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    link: { findUnique: vi.fn() },
    visit: { groupBy: vi.fn() },
  },
}));

vi.mock("@/lib/api-auth", () => ({
  getApiUser: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
  forbidden: () => Response.json({ error: "Forbidden" }, { status: 403 }),
  notFound: () => Response.json({ error: "Not found" }, { status: 404 }),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { GET } from "@/app/api/v1/stats/[linkId]/referrers/route";
import { prisma } from "@/lib/db";
import { getApiUser } from "@/lib/api-auth";

const mockGetApiUser = vi.mocked(getApiUser);
const mockPrisma = vi.mocked(prisma);

const ctx = (linkId: string) => ({ params: Promise.resolve({ linkId }) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/stats/:linkId/referrers", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetApiUser.mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost/api/v1/stats/link-1/referrers"), ctx("link-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when link does not exist", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(null as never);
    const res = await GET(makeRequest("http://localhost/api/v1/stats/missing/referrers"), ctx("missing"));
    expect(res.status).toBe(404);
  });

  it("returns referrer breakdown", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);
    mockPrisma.visit.groupBy.mockResolvedValue([
      { referer: "https://twitter.com", _count: { id: 4 } },
    ] as never);

    const res = await GET(makeRequest("http://localhost/api/v1/stats/link-1/referrers"), ctx("link-1"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data[0]).toEqual({ referer: "https://twitter.com", count: 4 });
  });
});
