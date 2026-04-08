import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest, MOCK_USER, MOCK_LINK } from "../../../../helpers";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    link: { findUnique: vi.fn() },
    visit: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api-auth", () => ({
  getApiUser: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
  forbidden: () => Response.json({ error: "Forbidden" }, { status: 403 }),
  notFound: () => Response.json({ error: "Not found" }, { status: 404 }),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { GET } from "@/app/api/v1/stats/[linkId]/route";
import { prisma } from "@/lib/db";
import { getApiUser } from "@/lib/api-auth";

const mockGetApiUser = vi.mocked(getApiUser);
const mockPrisma = vi.mocked(prisma);

const ctx = (linkId: string) => ({ params: Promise.resolve({ linkId }) });

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET /api/v1/stats/:linkId ─────────────────────────────────────────────────

describe("GET /api/v1/stats/:linkId", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetApiUser.mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost/api/v1/stats/link-1"), ctx("link-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when link does not exist", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(null as never);
    const res = await GET(makeRequest("http://localhost/api/v1/stats/missing"), ctx("missing"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when link belongs to another user", async () => {
    mockGetApiUser.mockResolvedValue({ ...MOCK_USER, id: "other" });
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);
    const res = await GET(makeRequest("http://localhost/api/v1/stats/link-1"), ctx("link-1"));
    expect(res.status).toBe(403);
  });

  it("returns aggregate stats for the link owner", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);
    mockPrisma.visit.groupBy.mockResolvedValue([] as never);
    mockPrisma.visit.count.mockResolvedValue(5 as never);

    const res = await GET(makeRequest("http://localhost/api/v1/stats/link-1"), ctx("link-1"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.totalClicks).toBe("42");
    expect(json.data.totalVisitsLogged).toBe(5);
    expect(json.data.topCountries).toEqual([]);
  });
});
