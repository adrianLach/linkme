import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest, MOCK_USER, MOCK_ADMIN, MOCK_LINK } from "../../helpers";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    link: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

import { GET, PATCH, DELETE } from "@/app/api/v1/links/[id]/route";
import { prisma } from "@/lib/db";
import { getApiUser } from "@/lib/api-auth";

const mockGetApiUser = vi.mocked(getApiUser);
const mockPrisma = vi.mocked(prisma);

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET /api/v1/links/:id ─────────────────────────────────────────────────────

describe("GET /api/v1/links/:id", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetApiUser.mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost/api/v1/links/link-1"), ctx("link-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when link does not exist", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(null as never);
    const res = await GET(makeRequest("http://localhost/api/v1/links/missing"), ctx("missing"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when link belongs to another user", async () => {
    mockGetApiUser.mockResolvedValue({ ...MOCK_USER, id: "other-user" });
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);
    const res = await GET(makeRequest("http://localhost/api/v1/links/link-1"), ctx("link-1"));
    expect(res.status).toBe(403);
  });

  it("admin can view any link", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_ADMIN);
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);
    const res = await GET(makeRequest("http://localhost/api/v1/links/link-1"), ctx("link-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.slug).toBe("abc1234");
    expect(json.data.clickCount).toBe("42");
  });

  it("returns link for the owner", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(MOCK_LINK as never);
    const res = await GET(makeRequest("http://localhost/api/v1/links/link-1"), ctx("link-1"));
    expect(res.status).toBe(200);
  });
});

// ── PATCH /api/v1/links/:id ───────────────────────────────────────────────────

describe("PATCH /api/v1/links/:id", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetApiUser.mockResolvedValue(null);
    const res = await PATCH(
      makeRequest("http://localhost/api/v1/links/link-1", {
        method: "PATCH",
        body: { title: "Updated" },
      }),
      ctx("link-1")
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when link does not exist", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(null as never);
    const res = await PATCH(
      makeRequest("http://localhost/api/v1/links/missing", {
        method: "PATCH",
        body: { title: "Updated" },
      }),
      ctx("missing")
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when link belongs to another user", async () => {
    mockGetApiUser.mockResolvedValue({ ...MOCK_USER, id: "other-user" });
    mockPrisma.link.findUnique.mockResolvedValue({ id: "link-1", userId: "user-1" } as never);
    const res = await PATCH(
      makeRequest("http://localhost/api/v1/links/link-1", {
        method: "PATCH",
        body: { title: "Updated" },
      }),
      ctx("link-1")
    );
    expect(res.status).toBe(403);
  });

  it("returns 422 on invalid url", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue({ id: "link-1", userId: "user-1" } as never);
    const res = await PATCH(
      makeRequest("http://localhost/api/v1/links/link-1", {
        method: "PATCH",
        body: { url: "not-a-url" },
      }),
      ctx("link-1")
    );
    expect(res.status).toBe(422);
  });

  it("updates a link successfully", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue({ id: "link-1", userId: "user-1" } as never);
    mockPrisma.link.update.mockResolvedValue({ ...MOCK_LINK, title: "Updated" } as never);

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/links/link-1", {
        method: "PATCH",
        body: { title: "Updated", active: false },
      }),
      ctx("link-1")
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.title).toBe("Updated");
  });
});

// ── DELETE /api/v1/links/:id ──────────────────────────────────────────────────

describe("DELETE /api/v1/links/:id", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetApiUser.mockResolvedValue(null);
    const res = await DELETE(
      makeRequest("http://localhost/api/v1/links/link-1", { method: "DELETE" }),
      ctx("link-1")
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when link does not exist", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue(null as never);
    const res = await DELETE(
      makeRequest("http://localhost/api/v1/links/missing", { method: "DELETE" }),
      ctx("missing")
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when link belongs to another user", async () => {
    mockGetApiUser.mockResolvedValue({ ...MOCK_USER, id: "other-user" });
    mockPrisma.link.findUnique.mockResolvedValue({ id: "link-1", userId: "user-1" } as never);
    const res = await DELETE(
      makeRequest("http://localhost/api/v1/links/link-1", { method: "DELETE" }),
      ctx("link-1")
    );
    expect(res.status).toBe(403);
  });

  it("deletes the link and returns 204", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.link.findUnique.mockResolvedValue({ id: "link-1", userId: "user-1" } as never);
    mockPrisma.link.delete.mockResolvedValue(MOCK_LINK as never);

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/links/link-1", { method: "DELETE" }),
      ctx("link-1")
    );
    expect(res.status).toBe(204);
  });
});
