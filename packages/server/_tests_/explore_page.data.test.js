/**
 * Data validation tests for GET /api/explore_page
 */
const request = require("supertest");
const app = require("../index");
const { createClient } = require("@supabase/supabase-js");

jest.mock("@supabase/supabase-js");

describe("GET /api/explore_page - Data Validation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("joins hospitals with addresses and doctors with hospitals + specialties", async () => {
    createClient.mockReturnValue({
      from: (table) => ({
        select: jest.fn().mockResolvedValue(
          {
            hospitals: {
              data: [{ hospital_id: 1, address_id: 10, name: "Test Hospital" }],
              error: null,
            },
            address: {
              data: [{ address_id: 10, street: "123 Mock St" }],
              error: null,
            },
            doctors: {
              data: [
                { doctor_id: 5, hospital_id: 1, specialty_id: 22, name: "Dr. Mock" }
              ],
              error: null,
            },
            specialty: {
              data: [{ specialty_id: 22, name: "Cardiology" }],
              error: null,
            },
          }[table]
        )
      })
    });

    const res = await request(app).get("/api/explore_page");

    expect(res.statusCode).toBe(200);

    // Hospital has address joined
    expect(res.body.hospitals[0]).toHaveProperty("address");
    expect(res.body.hospitals[0].address.street).toBe("123 Mock St");

    // Doctor has hospital + specialty
    const doctor = res.body.doctors[0];
    expect(doctor.hospital.name).toBe("Test Hospital");
    expect(doctor.specialty.name).toBe("Cardiology");
  });
});
