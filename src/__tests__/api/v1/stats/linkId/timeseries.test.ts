import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest, MOCK_USER, MOCK_LINK } from "../../../../helpers";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    link: { findUnique: vi.fn() },
    visit: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/api-auth", () => ({
  getApiUser: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
  forbidden: () => Response.json({ error: "Forbidden" }, { status: 403 }),
  notFound: () => Response.json({ error: "Not found" }, { status: 404 }),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { GET } from "@/app/api/v1/stats/[linkId]/timeseries/route";
import { prisma } from "@/lib/db";
import { getApiUser } from "@/lib/api-auth";

const mockGetApiUser = vi.mocked(getApiUser);
const mockPrisma = vi.mocked(prisma);

const ctx = (linkId: string) => ({ params: Promise.resolve({ linkId }) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/stats/:linkId/timeseries", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetApiUser.mockResolvedValue(null);
    const res = await GET(
      makeRequest("http://localhost/api/v1/stats/link-1/timeseries"),
      ctx("link-1")
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when link does not exist", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(null as never);
    const res = await GET(
      makeRequest("http://localhost/api/v1/stats/missing/timeseries"),
      ctx("missing")
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 on invalid granularity", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);
    const res = await GET(
      makeRequest("http://localhost/api/v1/stats/link-1/timeseries?granularity=year"),
      ctx("link-1")
    );
    expect(res.status).toBe(400);
  });

  it("returns daily time series data", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);
    mockPrisma.visit.findMany.mockResolvedValue([
      { createdAt: new Date("2026-01-05T12:00:00Z") },
      { createdAt: new Date("2026-01-05T14:00:00Z") },
      { createdAt: new Date("2026-01-06T10:00:00Z") },
    ] as never);

    const res = await GET(
      makeRequest(
        "http://localhost/api/v1/stats/link-1/timeseries?granularity=day&from=2026-01-01T00:00:00Z&to=2026-01-31T23:59:59Z"
      ),
      ctx("link-1")
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    // Two visits on Jan 5, one on Jan 6 → 2 buckets
    expect(json.data).toHaveLength(2);
    expect(json.data[0].count).toBe(2);
    expect(json.data[1].count).toBe(1);
  });

  it("returns hourly time series data", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);
    mockPrisma.visit.findMany.mockResolvedValue([
      { createdAt: new Date("2026-01-05T12:00:00Z") },
      { createdAt: new Date("2026-01-05T12:30:00Z") },
      { createdAt: new Date("2026-01-05T13:00:00Z") },
    ] as never);

    const res = await GET(
      makeRequest("http://localhost/api/v1/stats/link-1/timeseries?granularity=hour"),
      ctx("link-1")
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    // Two visits at hour 12, one at hour 13 → 2 buckets
    expect(json.data).toHaveLength(2);
    expect(json.data[0].count).toBe(2);
    expect(json.data[1].count).toBe(1);
  });
});
