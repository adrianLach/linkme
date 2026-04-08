import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest, MOCK_USER } from "../../helpers";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { update: vi.fn() },
  },
}));

vi.mock("@/lib/api-auth", () => ({
  getApiUser: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("nanoid", () => ({ nanoid: () => "testkey00000000000000000000000000" }));

// ── Import after mocks ────────────────────────────────────────────────────────

import { POST, DELETE } from "@/app/api/v1/user/api-key/route";
import { prisma } from "@/lib/db";
import { getApiUser } from "@/lib/api-auth";

const mockGetApiUser = vi.mocked(getApiUser);
const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

// ── POST /api/v1/user/api-key ─────────────────────────────────────────────────

describe("POST /api/v1/user/api-key", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetApiUser.mockResolvedValue(null);
    const res = await POST(makeRequest("http://localhost/api/v1/user/api-key", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("generates and returns a new API key", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.user.update.mockResolvedValue({} as never);

    const res = await POST(makeRequest("http://localhost/api/v1/user/api-key", { method: "POST" }));
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.data.apiKey).toMatch(/^lm_/);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: MOCK_USER.id },
        data: expect.objectContaining({ apiKey: expect.stringMatching(/^lm_/) }),
      })
    );
  });
});

// ── DELETE /api/v1/user/api-key ───────────────────────────────────────────────

describe("DELETE /api/v1/user/api-key", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetApiUser.mockResolvedValue(null);
    const res = await DELETE(
      makeRequest("http://localhost/api/v1/user/api-key", { method: "DELETE" })
    );
    expect(res.status).toBe(401);
  });

  it("revokes the API key and returns 204", async () => {
    mockGetApiUser.mockResolvedValue(MOCK_USER);
    mockPrisma.user.update.mockResolvedValue({} as never);

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/user/api-key", { method: "DELETE" })
    );
    expect(res.status).toBe(204);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: MOCK_USER.id },
      data: { apiKey: null },
    });
  });
});
