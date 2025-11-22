import express from "express";
import path from "path";
import ViteExpress from "vite-express";
import dotenv from "dotenv";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config(); //configures process.env from .env file

const app = express(); // initilize express app
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== "production";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- SUPABASE CLIENT INITIALIZATION ---
// Create a single Supabase client for interacting with your database
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Check .env file.");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

//Check Auth
const checkAuth = async (req, res, next) => {
  // Check for an 'Authorization' header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized: No token provided" });

  // Extract the token
  const token = authHeader.split(" ")[1];

  req.supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  // Verify the token with Supabase
  try {
    const {
      data: { user },
      error,
    } = await req.supabase.auth.getUser(token);

    if (error)
      return res.status(401).json({ error: "Unauthorized: " + error.message });
    if (!user)
      return res.status(401).json({ error: "Unauthorized: Invalid token" });

    // Attach user info to the request and proceed
    req.user = user;
    next();
  } catch (error) {
    console.error("Unexpected error in auth middleware:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Dummy API route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Add your API routes here
app.get("/api/test", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

// Sign up - create auth user and patient record
app.post("/api/sign_up", async (req, res) => {
  const formData = req.body;

  console.log("Signup data received:", formData);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: "http://localhost:3000/Profile",
      },
    });

    if (error) {
      console.error("Auth signup error:", error);
      return res.status(400).json({ error: error.message });
    }

    if (!data.user) {
      console.error("No user returned from signup");
      return res.status(400).json({ error: "Failed to create user" });
    }

    console.log("Auth user created:", data.user.id);

    // Check if patient already exists
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (existingPatient) {
      console.log("Patient already exists:", existingPatient);
      // If missing names, update them
      if (!existingPatient.first_name || !existingPatient.last_name) {
        console.log("Updating missing names...");
        const { error: updateError } = await supabase
          .from("patients")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
          })
          .eq("user_id", data.user.id);

        if (updateError) {
          console.error("Failed to update names:", updateError);
        } else {
          console.log("Names updated successfully");
        }
      }

      return res.json({
        message: "Sign-up successful",
        session: data.session,
      });
    }

    // Create new patient
    console.log("Inserting patient with:", {
      user_id: data.user.id,
      first_name: formData.first_name,
      last_name: formData.last_name,
    });

    const { data: insertedPatient, error: patientError } = await supabase
      .from("patients")
      .insert({
        user_id: data.user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
      })
      .select();

    if (patientError) {
      console.error("Patient insert error:", patientError);
      return res.status(400).json({
        error: "Account created but profile setup failed.",
      });
    }

    console.log("Patient record created:", insertedPatient);

    return res.json({
      message: "Sign-up successful",
      session: data.session,
    });
  } catch (err) {
    console.error("Unexpected signup error:", err);
    return res.status(500).json({ error: "Server error during signup" });
  }
});

// Log in - return session token
app.post("/api/log_in", async (req, res) => {
  const formData = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({
    message: "Login successful",
    session: data.session,
  });
});

// Log out
app.post("/api/log_out", checkAuth, async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];

  const { error } = await supabase.auth.signOut(token);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ message: "Logout successful" });
});

// Reset password
app.post("/api/reset_password", async (req, res) => {
  const { email } = req.body;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "http://localhost:3000/reset-password",
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ message: "Password reset email sent" });
});

// Get profile data for authenticated user
app.get("/api/profile_data", checkAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("patients")
    .select(
      `
      *,
      address: address_fk(*)
    `
    )
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching patient:", error);
    return res.status(500).json({ error: "Failed to fetch patient" });
  }

  // Add email from auth user
  res.json({
    patients: {
      ...data,
      email: req.user.email,
    },
  });
});

// Update patient profile
app.put("/api/update_profile", checkAuth, async (req, res) => {
  const { first_name, last_name, phone_number, gender, middle_initial } =
    req.body;

  const { error } = await supabase
    .from("patients")
    .update({
      first_name,
      last_name,
      phone_number,
      gender,
      middle_initial,
    })
    .eq("user_id", req.user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }

  res.json({ message: "Profile updated successfully" });
});

// Update patient address
app.put("/api/update_address", checkAuth, async (req, res) => {
  const { street, city, state, zip_code } = req.body;

  try {
    console.log("Updating address:", { street, city, state, zip_code });

    // First get the patient's address_fk
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("address_fk")
      .eq("user_id", req.user.id)
      .single();

    if (patientError) {
      console.error("Error fetching patient:", patientError);
      throw patientError;
    }

    console.log("Patient address_fk:", patient?.address_fk);

    if (patient?.address_fk) {
      // Update existing address
      console.log("Updating existing address:", patient.address_fk);
      const { error } = await supabase
        .from("address")
        .update({ street, city, state, zip_code })
        .eq("address_id", patient.address_fk);

      if (error) {
        console.error("Error updating address:", error);
        throw error;
      }
      console.log("Address updated successfully");
    } else {
      // Create new address
      console.log("Creating new address");
      const { data: newAddress, error: insertError } = await supabase
        .from("address")
        .insert({ street, city, state, zip_code })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting address:", insertError);
        throw insertError;
      }

      console.log("Linking address to patient:", newAddress.address_id);

      // Link address to patient
      const { error: updateError } = await supabase
        .from("patients")
        .update({ address_fk: newAddress.address_id })
        .eq("user_id", req.user.id);

      if (updateError) {
        console.error("Error linking address:", updateError);
        throw updateError;
      }
      console.log("Address created and linked successfully");
    }

    res.json({ message: "Address updated successfully" });
  } catch (err) {
    console.error("Error updating address:", err);
    res
      .status(500)
      .json({ error: "Failed to update address", details: err.message });
  }
});

// API explore page that pulls nested data
app.get("/api/explore_page", async (req, res) => {
  try {
    // Fetch all tables separately
    const [hospitalsRes, addressesRes, doctorsRes, specialtiesRes] =
      await Promise.all([
        supabase.from("hospitals").select("*"),
        supabase.from("address").select("*"),
        supabase.from("doctors").select("*"),
        supabase.from("specialty").select("*"),
      ]);

    if (hospitalsRes.error) throw hospitalsRes.error;
    if (addressesRes.error) throw addressesRes.error;
    if (doctorsRes.error) throw doctorsRes.error;
    if (specialtiesRes.error) throw specialtiesRes.error;

    // Create lookup maps for faster joins
    const addressMap = {};
    addressesRes.data.forEach((addr) => {
      addressMap[addr.address_id] = addr;
    });

    const specialtyMap = {};
    specialtiesRes.data.forEach((spec) => {
      specialtyMap[spec.specialty_id] = spec;
    });

    // Join hospitals with addresses
    const hospitals = hospitalsRes.data.map((hospital) => ({
      ...hospital,
      address: addressMap[hospital.address_id] || null,
    }));

    // Create hospital map for doctor joins
    const hospitalMap = {};
    hospitals.forEach((hosp) => {
      hospitalMap[hosp.hospital_id] = hosp;
    });

    // Join doctors with hospitals (which include addresses) and specialties
    const doctors = doctorsRes.data.map((doctor) => ({
      ...doctor,
      hospital: hospitalMap[doctor.hospital_id] || null,
      specialty: specialtyMap[doctor.specialty_id] || null,
    }));

    res.json({ hospitals, doctors });
  } catch (err) {
    console.error("Unexpected error in /api/explore_page:", err);
    res.status(500).json({ error: err.message });
  }
});

// Appointment routes

/**
 * GET /api/provider_availability/:id/slots
 * Description:
 * fetches available time slots for a specific provider on a given date.
 *
 * URL Parameters:
 * - id (uuid): ID of the provider
 *
 * Query Parameters:
 * - date (string): Date to check availability for (format: YYYY-MM-DD)
 */
app.get("/api/provider_availability/:id/slots", async (req, res) => {
  const providerId = req.params.id;
  const date = req.query.date;
  if (!date) {
    return res.status(400).json({ error: "Missing date query parameter" });
  }
  const { data: available_times, error } = await req.supabase
    .from("provider_availability")
    .select("*")
    .eq("provider_id", providerId)
    .eq("date", date);
  if (error) {
    console.error("Error fetching provider availability:", error);
    return res.status(500).json({ error: error.message });
  }
  res.json(available_times);
});

/**
 * GET /api/appointments
 * Description:
 * fetches a list of appointments for the authenticated user,
 *
 * Query Parameters:
 * - status: Optional. Filter appointments by status (all, scheduled, completed, cancelled). Default is all
 * - sort_by: Optional. Field to sort by (e.g., date, created_at). Default is date
 * - order: Optional. asc or desc for sorting order. Default is desc
 *
 * Returns:
 * - JSON: { data: [ ...appointments ] }
 */
app.get("/api/appointments", checkAuth, async (req, res) => {
  const statusFilter = req.query.status; // all, scheduled, completed, cancelled
  const sortBy = req.query.sort_by;
  const order = req.query.order === "asc";
  // Build the query
  let query = req.supabase
    .from("appointments")
    .select(
      `
        *,
        reason: notes,
        slot: provider_availability!slot_id (
          date,
          slot_start,
          slot_end
        ),
        hospital: hospitals!provider_id (
        name,
        address: address_id(*)
        )
      `
    )
    .eq("user_id", req.user.id);
  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  // sorting
  if (sortBy && sortBy !== "date") {
    // e.g., ?sort_by=created_at
    query = query.order(sortBy, { ascending: order });
  } else {
    // if no sorting preference is provided, sort by slot
    // Sort by date, then by time, from the joined table
    query = query.order("date", {
      foreignTable: "slot",
      ascending: order,
    });
    query = query.order("slot_start", {
      foreignTable: "slot",
      ascending: order,
    });
  }

  // executing the query
  const { data, error } = await query;
  if (error) {
    return res
      .status(400)
      .json({ "Error fetching appointments:": error.message });
  }
  res.json({ data });
});

/**
 * POST /api/appointments
 * Description:
 * Books a new appointment for the authenticated user. Checks slot availability first,
 * then marks the slot as booked and creates the appointment record.
 *
 * Request Body:
 * - slot_id (uuid): ID of the provider availability slot to book
 * - visit_type (string): Type of visit (e.g., "new_patient", "follow_up", "sick_visit")
 * - reason (string): Detailed reason for the visit (maps to DB column 'notes')
 *
 * Returns:
 * -- Success: { message: "Appointment created successfully" }
 * -- Failure: { error: "Error message describing the issue" }
 */
app.post("/api/appointments", checkAuth, async (req, res) => {
  const { reason, visit_type, slot_id } = req.body;
  const user_id = req.user.id;
  const { data: slot, error: slotError } = await req.supabase
    .from("provider_availability")
    .select()
    .eq("id", slot_id)
    .single();
  if (slotError) {
    return res.status(400).json({ error: slotError.message });
  }
  if (slot.is_booked) {
    return res.status(400).json({ error: "Selected slot is not available" });
  }
  const { error: update_error } = await req.supabase
    .from("provider_availability")
    .update({ is_booked: true })
    .eq("id", slot_id);
  if (update_error) {
    return res.status(400).json({ error: update_error.message });
  }
  const { error: insert_error } = await req.supabase
    .from("appointments")
    .insert({
      notes: reason,
      visit_type,
      status: "scheduled",
      user_id,
      slot_id,
      provider_id: slot.provider_id,
    });

  if (insert_error) {
    console.error("Appointment insert failed, rolling back slot...");
    await req.supabase
      .from("provider_availability")
      .update({ is_booked: false })
      .eq("id", slot_id);
    return res.status(400).json({ error: insert_error.message });
  }
  res.json({ message: "Appointment created successfully" });
});

/**
 * PATCH /api/appointments/:id/cancel
 * Description:
 * Cancels an existing appointment by its ID and frees up the associated provider availability slot.
 *
 * URL Parameters:
 * - id (int): ID of the appointment to cancel
 *
 * Returns:
 * - Success: { message: "Appointment cancelled successfully" }
 * - Failure: { error: "Error message describing the issue" }
 */
app.patch("/api/appointments/:id/cancel", checkAuth, async (req, res) => {
  const appointmentId = req.params.id;
  const { data: appointment, error: fetch_error } = await req.supabase
    .from("appointments")
    .select("slot_id, status")
    .eq("id", appointmentId)
    .maybeSingle();
  if (fetch_error) {
    return res.status(400).json({ error: fetch_error.message });
  }
  if (!appointment) {
    return res.status(404).json({ error: "Appointment not found" });
  }
  console.log(appointment);
  if (appointment.status === "cancelled") {
    return res.status(400).json({ error: "Appointment is already cancelled" });
  }
  // mark appointment as cancelled
  const { error: aptError } = await req.supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId);

  if (aptError) {
    return res.status(400).json({ error: aptError.message });
  }

  // update provider_availability is_booked to false
  const { data: slotData, error: slotError } = await req.supabase
    .from("provider_availability")
    .update({ is_booked: false })
    .eq("id", appointment.slot_id)
    .select();
  if (slotError) {
    return res.status(400).json({ "Error freeing slot:": slotError.message });
  }
  if (!slotData || slotData.length === 0) {
    return res
      .status(404)
      .json({ error: "Associated slot not found to free up" });
  }
  res.json({ message: "Appointment cancelled successfully" });
});

/**
 * PATCH /api/appointments/:id/reschedule
 * Description:
 * Reschedules an existing appointment to a new provider availability slot.
 * Frees up the old slot and marks the new slot as booked.
 *
 * URL Parameters:
 * - id (int): ID of the appointment to reschedule
 *
 * Request Body:
 * - new_slot_id (uuid): ID of the new provider availability slot to book
 *
 * Returns:
 * - Success: { message: "Appointment rescheduled successfully" }
 * - Failure: { error: "Error message describing the issue" }
 */
app.patch("/api/appointments/:id/reschedule", checkAuth, async (req, res) => {
  const appointmentId = req.params.id;
  const { new_slot_id } = req.body;
  if (!new_slot_id) {
    return res.status(400).json({ error: "Missing new_slot_id in body" });
  }
  const { data: appointment, error: appointment_error } = await req.supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .maybeSingle();
  if (appointment_error) {
    return res.status(400).json({ error: appointment_error.message });
  }
  if (appointment.status === "cancelled") {
    return res
      .status(400)
      .json({ error: "Cannot reschedule a cancelled appointment" });
  }
  const { error: update_availability_error } = await req.supabase
    .from("provider_availability")
    .update({ is_booked: false })
    .eq("id", appointment.slot_id);
  if (update_availability_error) {
    return res.status(400).json({ error: update_availability_error.message });
  }
  const { error: appointment_update_error } = await req.supabase
    .from("appointments")
    .update({ slot_id: new_slot_id })
    .eq("id", appointmentId);
  if (appointment_update_error) {
    return res.status(400).json({ error: appointment_update_error.message });
  }
  const { data: new_slot, error: new_availability_error } = await req.supabase
    .from("provider_availability")
    .update({ is_booked: true })
    .eq("id", new_slot_id)
    .select();
  if (new_availability_error) {
    return res.status(400).json({ error: new_availability_error.message });
  }
  if (!new_slot || new_slot.length === 0) {
    return res.status(404).json({ error: "New slot not found to book" });
  }
  res.json({ message: "Appointment rescheduled successfully" });
});

/**
 * PATCH /api/appointments/:id/update
 * Description:
 * Updates details of an existing appointment such as visit type or reason.
 *
 * URL Parameters:
 * - id (int): ID of the appointment to update
 *
 * Request Body:
 * - visit_type (string, optional): New visit type
 * - reason (string, optional): New reason for the visit
 * Must provide at least one of the fields to update.
 *
 * Returns:
 * - Success: { message: "Appointment updated successfully" }
 * - Failure: { error: "Error message describing the issue" }
 */
app.patch("/api/appointments/:id/update", checkAuth, async (req, res) => {
  const appointmentId = req.params.id;
  const { visit_type, reason } = req.body;
  if (!visit_type && !reason) {
    return res
      .status(400)
      .json({ error: "Please provide the new visit_type or reason" });
  }
  const updates = {};
  if (visit_type) updates.visit_type = visit_type;
  if (reason) updates.notes = reason;
  const { data: appointment, error: appointment_update_error } =
    await req.supabase
      .from("appointments")
      .update(updates)
      .eq("id", appointmentId)
      .select();

  if (appointment_update_error) {
    return res.status(400).json({ error: appointment_update_error.message });
  }
  if (!appointment || appointment.length === 0) {
    return res
      .status(404)
      .json({ error: "Appointment not found or permission denied" });
  }
  res.json({ message: "Appointment updated successfully" });
});

// Start the server
if (isDev) {
  // --- Development: use vite-express to run Vite as middleware ---
  const frontendRoot = path.resolve(__dirname, "../client");
  ViteExpress.config({
    mode: "development",
    inlineViteConfig: { root: frontendRoot },
  });

  ViteExpress.listen(app, PORT, () => {
    console.log(`Server running on http://localhost:${PORT} with ViteExpress`);
  });
} else {
  // In production, serve built files
  const distDir = path.resolve(__dirname, "../client/dist");
  app.use(express.static(distDir));

  //default to index.html for SPA
  app.get("*", (req, res) => {
    res.sendFile("index.html", { root: "../client/dist" });
  });

  app.listen(PORT, () => {
    console.log(`Server running on Port:${PORT}`);
  });
}
