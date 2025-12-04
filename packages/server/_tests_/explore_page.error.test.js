/**
 * Error handling tests for GET /api/explore_page
 */
const request = require("supertest");
const app = require("../index");
const { createClient } = require("@supabase/supabase-js");

jest.mock("@supabase/supabase-js");

describe("GET /api/explore_page - Error Handling", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 500 when Supabase throws", async () => {
    createClient.mockReturnValue({
      from: () => ({
        select: jest.fn().mockResolvedValue({ data: null, error: new Error("Supabase FAIL") })
      })
    });

    const res = await request(app).get("/api/explore_page");

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});
