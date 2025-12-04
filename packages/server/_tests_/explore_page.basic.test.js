
import request from "supertest";
import app from "../index.js"; // CJS server export
import { createClient } from "@supabase/supabase-js";

// Mock Supabase
jest.mock("@supabase/supabase-js");

describe("GET /api/explore_page - Basic", () => {
  let mockFrom;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the Supabase client methods
    mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    createClient.mockReturnValue({
      from: mockFrom
    });
  });

  it("returns hospitals and doctors arrays", async () => {
    const res = await request(app).get("/api/explore_page");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("hospitals");
    expect(res.body).toHaveProperty("doctors");
    expect(Array.isArray(res.body.hospitals)).toBe(true);
    expect(Array.isArray(res.body.doctors)).toBe(true);

    // Ensure Supabase was called for each table
    expect(mockFrom).toHaveBeenCalledWith("hospitals");
    expect(mockFrom).toHaveBeenCalledWith("address");
    expect(mockFrom).toHaveBeenCalledWith("doctors");
    expect(mockFrom).toHaveBeenCalledWith("specialty");
  });
});
