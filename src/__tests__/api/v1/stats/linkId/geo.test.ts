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

import { GET } from "@/app/api/v1/stats/[linkId]/geo/route";
import { prisma } from "@/lib/db";
import { getApiUser } from "@/lib/api-auth";

const mockGetApiUser = vi.mocked(getApiUser);
const mockPrisma = vi.mocked(prisma);

const ctx = (linkId: string) => ({ params: Promise.resolve({ linkId }) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/stats/:linkId/geo", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetApiUser.mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost/api/v1/stats/link-1/geo"), ctx("link-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when link does not exist", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(null as never);
    const res = await GET(makeRequest("http://localhost/api/v1/stats/missing/geo"), ctx("missing"));
    expect(res.status).toBe(404);
  });

  it("returns geo breakdown", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);
    mockPrisma.visit.groupBy
      .mockResolvedValueOnce([{ country: "US", _count: { id: 10 } }] as never) // countries
      .mockResolvedValueOnce([{ region: "California", _count: { id: 5 } }] as never) // regions
      .mockResolvedValueOnce([{ city: "San Francisco", _count: { id: 3 } }] as never); // cities

    const res = await GET(makeRequest("http://localhost/api/v1/stats/link-1/geo"), ctx("link-1"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.countries[0]).toEqual({ country: "US", count: 10 });
    expect(json.data.regions[0]).toEqual({ region: "California", count: 5 });
    expect(json.data.cities[0]).toEqual({ city: "San Francisco", count: 3 });
  });
});
