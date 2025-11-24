import express from "express";
import path from "path";
import ViteExpress from "vite-express";
import dotenv from "dotenv";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { sendAppointmentUpdate } from "./notificationService.js";
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

/**
 * Middleware to check authentication for protected routes.
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Returns:
 * - JSON: Error: { error: "Unauthorized: ..." }
 * - On success, attaches `user` to `req`, supabase client to `req.supabase`, and calls `next()`.
 */
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

/**
 * POST /api/sign_up
 * Description:
 * Registers a new user with email and password, and creates a patient record.
 *
 * Request Body:
 * - email (string): User's email
 * - password (string): User's password
 * - first_name (string): Patient's first name
 * - last_name (string): Patient's last name
 *
 * Returns:
 * - JSON: Success: { message: "Sign-up successful", session: { ... } }
 *   JSON: Failure: { error: "Error message describing the issue" }
 */
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

/**
 * POST /api/log_in
 * Description:
 * Authenticates a user with email and password
 *
 * Request Body:
 * - email (string): User's email
 * - password (string): User's password
 *
 * Returns:
 * - JSON: Success: { message: "Login successful", session: { ... } }
 *   JSON: Failure: { error: "Error message describing the issue" }
 */
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

/**
 * POST /api/log_out
 * Description:
 * Logs out the currently authenticated user by invalidating their session.
 */
app.post("/api/log_out", async (req, res) => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    // expired token or connection issue
    return res.json({ error: error.message });
  }

  return res.json({ message: "Logout successful" });
});

/**
 * POST /api/reset_password
 * Description:
 * Initiates a password reset process by sending a reset email to the user.
 *
 * Request Body:
 * - email (string): User's email
 *
 * Returns:
 * - JSON: Success: { message: "Password reset email sent" }
 *   JSON: Failure: { error: "Error message describing the issue" }
 */
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

/**
 * GET /api/profile_data
 * Description:
 * Fetches the profile data for the authenticated user, including nested address information.
 *
 * returns:
 * - JSON: { patients: { ...patientData, address: { ...addressData }, email: userEmail } }
 */
app.get("/api/profile_data", checkAuth, async (req, res) => {
  const { data, error } = await req.supabase
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

/**
 * PUT /api/update_profile
 * Description:
 * Updates the profile information for the authenticated user.
 *
 * Request Body:
 * - first_name (string): Patient's first name
 * - last_name (string): Patient's last name
 * - phone_number (string): Patient's phone number
 * - gender (string): Patient's gender
 * - middle_initial (string): Patient's middle initial
 * - OPTIONAL FOR ADMIN: user_id(string): List user being manipulated
 */
app.put("/api/update_profile", checkAuth, async (req, res) => {
  const { first_name, last_name, phone_number, gender, middle_initial } =
    req.body;
  if (req.user.role == "admin" && req.body.user_id) {
    //Allow admins to use api differently
    req.user.id = req.body.user_id;
  }
  const { error: updateError } = await req.supabase
    .from("patients")
    .update({
      first_name,
      last_name,
      phone_number,
      gender,
      middle_initial,
    })
    .eq("user_id", req.user.id);

  if (updateError) {
    console.error("Error updating profile:", updateError.message);
    return res.status(500).json({ error: "Failed to update profile" });
  }

  res.json({ message: "Profile updated successfully" });
});

/**
 * PUT /api/update_address
 * Description:
 * Updates or creates the address information for the authenticated user.
 *
 * Request Body:
 * - street (string): Street address
 * - city (string): City
 * - state (string): State
 * - zip_code (string): ZIP code
 */
app.put("/api/update_address", checkAuth, async (req, res) => {
  const { street, city, state, zip_code } = req.body;
  if (req.user.role == "admin" && req.body.user_id) {
    //Allow admins to use api differently
    req.user.id = req.body.user_id;
  }
  try {
    console.log("Updating address:", { street, city, state, zip_code });

    // First get the patient's address_fk
    const { data: patient, error: patientError } = await req.supabase
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
      const { error } = await req.supabase
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
      const { data: newAddress, error: insertError } = await req.supabase
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
      const { error: updateError } = await req.supabase
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

/**
 * GET /api/explore_page
 * Description:
 * Fetches data for the explore page, including hospitals with addresses and doctors with specialties.
 *
 * Returns:
 * - JSON: Success { hospitals: [ ... ], doctors: [ ... ] }
 *  JSON: Failure { error: "Error message describing the issue" }
 */
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
  const { data: available_times, error } = await supabase
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
 * GET /api/provider_availability
 * Description:
 * gets all slots.
 *
 * URL Parameters:
 * -none
 *
 * Query Parameters:
 * - none
 */
app.get("/api/provider_availability", async (req, res) => {
  const { data: available_times, error } = await supabase
    .from("provider_availability")
    .select(
      `*,
         hospital: hospitals!provider_id (
        name,
        address: address_id(*)
        )`
    );
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
  if (req.user.role == "admin" && req.body.user_id) {
    //Allow admins to use api differently
    req.user.id = req.body.user_id;
  }
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
        hospital_id,
        name,
        address: address_id(*)
      )
    `
    )
    .eq("user_id", req.user.id);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (sortBy && sortBy !== "date") {
    query = query.order(sortBy, { ascending: order });
  } else {
    // default: sort by date/time from slot
    query = query.order("date", {
      foreignTable: "slot",
      ascending: order,
    });
    query = query.order("slot_start", {
      foreignTable: "slot",
      ascending: order,
    });
  }

  const { data: rawAppointments, error } = await query;

  if (error) {
    console.error("Error fetching appointments:", error);
    return res.status(400).json({ error: error.message });
  }

  if (!rawAppointments || rawAppointments.length === 0) {
    return res.json({ data: [] });
  }

  // 2) Collect hospital IDs from provider_id (the provider is the hospital)
  const hospitalIds = [
    ...new Set(
      rawAppointments
        .map((apt) => apt.provider_id)
        .filter((id) => id !== null && id !== undefined)
    ),
  ];

  // 3) Fetch doctors for those hospitals, including specialty
  const { data: doctorRows, error: doctorError } = await req.supabase
    .from("doctors")
    .select(
      `
      doctor_id,
      first_name,
      last_name,
      email,
      phone_number,
      hospital_id,
      specialty: specialty_id (
        specialty_name
      )
    `
    )
    .in("hospital_id", hospitalIds);

  if (doctorError) {
    console.error("Error fetching doctors:", doctorError);
    // We can still return appointments without doctor info if you want:
    // return res.status(400).json({ error: doctorError.message });
  }

  // 4) Build a map: hospital_id -> doctor
  const doctorMap = {};
  (doctorRows || []).forEach((doc) => {
    // assuming one doctor per hospital for this project
    doctorMap[doc.hospital_id] = doc;
  });

  // 5) Attach doctor info to each appointment
  const enrichedAppointments = rawAppointments.map((apt) => ({
    ...apt,
    doctor: doctorMap[apt.provider_id] || null,
  }));

  res.json({ data: enrichedAppointments });
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
  if (req.user.role == "admin" && req.body.user_id) {
    //Allow admins to use api differently
    req.user.id = req.body.user_id;
  }
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
  const { data: appointment, error: insert_error } = await req.supabase
    .from("appointments")
    .insert({
      notes: reason,
      visit_type,
      status: "scheduled",
      user_id,
      slot_id,
      provider_id: slot.provider_id,
    })
    .select()
    .maybeSingle();

  if (insert_error) {
    console.error("Appointment insert failed, rolling back slot...");
    await req.supabase
      .from("provider_availability")
      .update({ is_booked: false })
      .eq("id", slot_id);
    return res.status(400).json({ error: insert_error.message });
  }
  // Get patient email and notify preference
  const { data: patientData } = await req.supabase
    .from("patients")
    .select("email, notify_email")
    .eq("user_id", appointment.user_id)
    .single();
  const { data: hospital } = await req.supabase
    .from("hospitals")
    .select("*")
    .eq("hospital_id", appointment.provider_id)
    .maybeSingle();
  const { data: slotData } = await req.supabase
    .from("provider_availability")
    .select("*")
    .eq("id", appointment.slot_id)
    .maybeSingle();
  if (patientData && patientData.notify_email && hospital) {
    // Send email notification
    await sendAppointmentUpdate(patientData.email, "created", {
      date: slotData.date,
      time: slotData.slot_start,
      hospitalName: hospital.hospital_name,
      address: hospital.address,
    });
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
  if (req.user.role == "admin" && req.body.user_id) {
    //Allow admins to use api differently
    req.user.id = req.body.user_id;
  }
  const { data: appointment, error: fetch_error } = await req.supabase
    .from("appointments")
    .select("slot_id, status, user_id, provider_id")
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
  // Get patient email and notify preference
  const { data: patientData } = await req.supabase
    .from("patients")
    .select("email, notify_email") // Assuming you added email to patients or join auth.users
    .eq("user_id", appointment.user_id)
    .single();
  const { data: hospital } = await req.supabase
    .from("hospitals")
    .select("*")
    .eq("hospital_id", appointment.provider_id)
    .maybeSingle();

  if (patientData && patientData.notify_email && hospital) {
    // Send email notification
    await sendAppointmentUpdate(patientData.email, "cancelled", {
      date: slotData.date,
      time: slotData.slot_start,
      hospitalName: hospital.hospital_name,
      address: hospital.address,
    });
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
  if (req.user.role == "admin" && req.body.user_id) {
    //Allow admins to use api differently
    req.user.id = req.body.user_id;
  }
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
  if (appointment.slot_id === new_slot_id) {
    return res
      .status(400)
      .json({ error: "New slot must be different from current slot" });
  }
  const { data: new_slot_data, error: new_slot_error } = await req.supabase
    .from("provider_availability")
    .select("*")
    .eq("id", new_slot_id)
    .maybeSingle();
  if (new_slot_error) {
    return res.status(400).json({ error: new_slot_error.message });
  }
  if (new_slot_data.is_booked) {
    return res.status(400).json({ error: "New slot is not available" });
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
  // Get patient email and notify preference
  const { data: patientData } = await req.supabase
    .from("patients")
    .select("email, notify_email")
    .eq("user_id", appointment.user_id)
    .single();
  const { data: hospital } = await req.supabase
    .from("hospitals")
    .select("*")
    .eq("hospital_id", appointment.provider_id)
    .maybeSingle();
  if (patientData && patientData.notify_email && hospital) {
    // Send email notification
    await sendAppointmentUpdate(patientData.email, "rescheduled", {
      date: new_slot_data.date,
      time: new_slot_data.slot_start,
      hospitalName: hospital.hospital_name,
      address: hospital.address,
    });
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
  if (req.user.role == "admin" && req.body.user_id) {
    //Allow admins to use api differently
    req.user.id = req.body.user_id;
  }
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
      .select()
      .maybeSingle();

  if (appointment_update_error) {
    return res.status(400).json({ error: appointment_update_error.message });
  }
  if (!appointment || appointment.length === 0) {
    return res
      .status(404)
      .json({ error: "Appointment not found or permission denied" });
  }
  // Get patient email and notify preference
  const { data: patientData, error: patientError } = await req.supabase
    .from("patients")
    .select("email, notify_email")
    .eq("user_id", appointment.user_id)
    .single();
  const { data: hospital, error: hospitalError } = await req.supabase
    .from("hospitals")
    .select("*")
    .eq("hospital_id", appointment.provider_id)
    .maybeSingle();
  const { data: slotData } = await req.supabase
    .from("provider_availability")
    .select("*")
    .eq("id", appointment.slot_id)
    .maybeSingle();
  if (patientData && patientData.notify_email && hospital) {
    // Send email notification
    await sendAppointmentUpdate(patientData.email, "updated", {
      date: slotData.date,
      time: slotData.slot_start,
      hospitalName: hospital.hospital_name,
      address: hospital.address,
    });
  }
  res.json({ message: "Appointment updated successfully" });
});

/**
 * GET /api/admin/appointments
 * Description:
 * fetches a list of all appointments for users
 *
 * Query Parameters:
 * - status: Optional. Filter appointments by status (all, scheduled, completed, cancelled). Default is all
 * - sort_by: Optional. Field to sort by (e.g., date, created_at). Default is date
 * - order: Optional. asc or desc for sorting order. Default is desc
 *
 * Returns:
 * - JSON: { data: [ ...appointments ] }
 */
app.get("/api/admin/appointments", checkAuth, async (req, res) => {
  const statusFilter = req.query.status; // all, scheduled, completed, cancelled
  const sortBy = req.query.sort_by;
  const order = req.query.order === "asc";
  // Build the query
  let query = req.supabase.from("appointments").select(
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
  );

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
 * GET /api/admin/insert_availability
 * Description:
 * inserts new provider availability slots into the provider_availability table
 *
 * Request Body:
 * - provider_id (uuid, required): ID of the provider
 * - date (string, required): Date for the availability slot (format: YYYY-MM-DD)
 * - slot_start (string, required): Start time of the slot (format: HH:MM:SS)
 * - slot_end (string, required): End time of the slot (format: HH:MM:SS)
 *
 *
 * - Success: { message: "Availability created successfully" }
 * - Failure: { error: "Error message" }
 */

app.post("/api/admin/insert_availability", checkAuth, async (req, res) => {
  if (req.user.role != "admin") {
    return res.status(400).json({ error: "Not Allowed: Admins only" });
  }
  const { provider_id, date, slot_start, slot_end } = req.body;

  if (!provider_id || !date || !slot_start || !slot_end) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { data, error } = await req.supabase
      .from("provider_availability")
      .insert({
        provider_id,
        date,
        slot_start,
        slot_end,
        is_booked: false,
      });
    if (error) {
      console.error("Error inserting availability:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Availability created successfully" });
  } catch (err) {
    console.error("Unexpected error inserting availability:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/admin/delete_availability
 * Description:
 * Admin can delete an availablity slot by ID
 *
 * URL Parameters:
 * - id (uuid): ID of the availability slot to delete
 *
 * - Success: { message: "Availability deleted successfully" }
 * - Failure: { error: "Error message" }
 */

app.delete("/api/admin/delete_availability", checkAuth, async (req, res) => {
  if (req.user.role != "admin") {
    return res.status(400).json({ error: "Not Allowed: Admins only" });
  }

  const slotId = req.query.id;

  try {
    const { data, error } = await req.supabase
      .from("provider_availability")
      .delete()
      .eq("id", slotId);

    if (error) {
      console.error("Error deleting availability:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Availability deleted successfully" });
  } catch (error) {
    console.error("Error deleting availability:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
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
