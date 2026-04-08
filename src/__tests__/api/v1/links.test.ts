import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest, MOCK_USER, MOCK_LINK } from "../../helpers";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    link: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api-auth", () => ({
  getApiUser: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("nanoid", () => ({ nanoid: () => "gen1234" }));

// ── Import after mocks ────────────────────────────────────────────────────────

import { GET, POST } from "@/app/api/v1/links/route";
import { prisma } from "@/lib/db";
import { getApiUser } from "@/lib/api-auth";

const mockGetApiUser = vi.mocked(getApiUser);
const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET /api/v1/links ─────────────────────────────────────────────────────────

describe("GET /api/v1/links", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetApiUser.mockResolvedValue(null);
    const req = makeRequest("http://localhost/api/v1/links");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns paginated links for authenticated user", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    const linkRow = { ...MOCK_LINK };
    mockPrisma.link.findMany.mockResolvedValue([linkRow] as never);
    mockPrisma.link.count.mockResolvedValue(1 as never);

    const req = makeRequest("http://localhost/api/v1/links?page=1&limit=10");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.meta.total).toBe(1);
    expect(json.data[0].slug).toBe("abc1234");
    // BigInt serialized to string
    expect(json.data[0].clickCount).toBe("42");
  });

  it("clamps limit to 100", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findMany.mockResolvedValue([] as never);
    mockPrisma.link.count.mockResolvedValue(0 as never);

    const req = makeRequest("http://localhost/api/v1/links?limit=9999");
    await GET(req);

    expect(mockPrisma.link.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });
});

// ── POST /api/v1/links ────────────────────────────────────────────────────────

describe("POST /api/v1/links", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetApiUser.mockResolvedValue(null);
    const req = makeRequest("http://localhost/api/v1/links", {
      method: "POST",
      body: { url: "https://example.com" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid JSON", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    const req = new Request("http://localhost/api/v1/links", {
      method: "POST",
      body: "not json",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 422 on invalid body (missing url)", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    const req = makeRequest("http://localhost/api/v1/links", {
      method: "POST",
      body: { title: "No URL here" },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("returns 422 on invalid slug characters", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    const req = makeRequest("http://localhost/api/v1/links", {
      method: "POST",
      body: { url: "https://example.com", slug: "bad slug!" },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("returns 409 when slug already taken", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);

    const req = makeRequest("http://localhost/api/v1/links", {
      method: "POST",
      body: { url: "https://example.com", slug: "abc1234" },
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("creates a link with auto-generated slug", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(null as never);
    mockPrisma.link.create.mockResolvedValue({ ...MOCK_LINK, slug: "gen1234" } as never);

    const req = makeRequest("http://localhost/api/v1/links", {
      method: "POST",
      body: { url: "https://example.com" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.data.slug).toBe("gen1234");
    expect(json.data.clickCount).toBe("42");
  });

  it("creates a link with a custom slug", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(null as never);
    mockPrisma.link.create.mockResolvedValue({ ...MOCK_LINK, slug: "my-slug" } as never);

    const req = makeRequest("http://localhost/api/v1/links", {
      method: "POST",
      body: { url: "https://example.com", slug: "my-slug" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.data.slug).toBe("my-slug");
  });
});
