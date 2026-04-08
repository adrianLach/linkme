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

import { GET } from "@/app/api/v1/stats/[linkId]/devices/route";
import { prisma } from "@/lib/db";
import { getApiUser } from "@/lib/api-auth";

const mockGetApiUser = vi.mocked(getApiUser);
const mockPrisma = vi.mocked(prisma);

const ctx = (linkId: string) => ({ params: Promise.resolve({ linkId }) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/stats/:linkId/devices", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetApiUser.mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost/api/v1/stats/link-1/devices"), ctx("link-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when link does not exist", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(null as never);
    const res = await GET(makeRequest("http://localhost/api/v1/stats/missing/devices"), ctx("missing"));
    expect(res.status).toBe(404);
  });

  it("returns device/browser/OS breakdown", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);
    mockPrisma.visit.groupBy
      .mockResolvedValueOnce([{ browser: "Chrome", _count: { id: 8 } }] as never) // browsers
      .mockResolvedValueOnce([{ os: "macOS", _count: { id: 6 } }] as never) // operating systems
      .mockResolvedValueOnce([{ deviceType: "desktop", _count: { id: 7 } }] as never); // device types

    const res = await GET(makeRequest("http://localhost/api/v1/stats/link-1/devices"), ctx("link-1"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.browsers[0]).toEqual({ browser: "Chrome", count: 8 });
    expect(json.data.operatingSystems[0]).toEqual({ os: "macOS", count: 6 });
    expect(json.data.deviceTypes[0]).toEqual({ deviceType: "desktop", count: 7 });
  });
});
