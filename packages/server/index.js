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
  // 1. Check for an 'Authorization' header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized: No token provided" });

  // 2. Extract the token
  const token = authHeader.split(" ")[1];

  // 3. Verify the token with Supabase
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error)
      return res.status(401).json({ error: "Unauthorized: " + error.message });
    if (!user)
      return res.status(401).json({ error: "Unauthorized: Invalid token" });

    // 4. Attach user info to the request and proceed
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

/*
app.get('/api/providers/:id/slots', (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const providerId = req.params.id;
  const baseDate = new Date(`${date}T09:00:00Z`);
  const slots = Array.from({ length: 6 }).map((_, i) => {
    const start = new Date(baseDate);
    start.setHours(start.getHours() + i);
    return {
      slotId: `${providerId}-${start.toISOString()}`,
      start: start.toISOString(),
      end: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
      status: 'available',
    };
  });
  res.json({ providerId, date, slots, timezone: 'UTC' });
});
*/

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
    .single();

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

// // insert appointment
// app.post("/api/appointments", checkAuth, async (req, res) => {
//   const { reason, visit_type, status, user_id, provider_availability_id } =
//     req.body;
//   const { provider_availability, provider_error } = await supabase
//     .from("provider_availability")
//     .select()
//     .eq("id", provider_availability_id)
//     .single();
//   if (provider_error) {
//     return res.status(400).json({ error: provider_error.message });
//   }
//   if (provider_availability.status !== "available") {
//     return res.status(400).json({ error: "Selected slot is not available" });
//   }
//   provider_availability.status = "booked";
//   const { update_error } = await supabase
//     .from("provider_availability")
//     .update({ status: "booked" })
//     .eq("id", provider_availability_id);
//   if (update_error) {
//     return res.status(400).json({ error: update_error.message });
//   }
//   const { insert_error } = await supabase.from("appointments").insert({
//     reason,
//     visit_type,
//     status,
//     user_id,
//     provider_availability_id,
//   });

//   if (insert_error) {
//     return res.status(400).json({ error: insert_error.message });
//   }
//   res.json({ message: "Appointment created successfully" });
// });

// // Cancel an appointment given its ID
// app.patch("/api/appointments/:id/cancel", checkAuth, async (req, res) => {
//   const appointmentId = req.params.id;
//   const { appointment, appointments_update_error } = await supabase
//     .from("appointments")
//     .update({ status: "cancelled" })
//     .eq("id", appointmentId);

//   if (appointments_update_error) {
//     return res.status(400).json({ error: appointments_update_error.message });
//   }
//   // update provider_availability status to 'available'
//   const { availability_update_error } = await supabase
//     .from("provider_availability")
//     .update({ status: "available" })
//     .eq("id", appointment.provider_availability_id);
//   if (availability_update_error) {
//     return res.status(400).json({ error: availability_update_error.message });
//   }
//   res.json({ message: "Appointment cancelled successfully" });
// });

// // reschedule an appointment given its ID
// app.patch("/api/appointments/:id/reschedule", checkAuth, async (req, res) => {
//   const appointmentId = req.params.id;
//   new_schedule_id = req.body.new_schedule_id;
//   const { appointment, appointment_error } = await supabase
//     .from("appointments")
//     .select("*")
//     .eq("id", appointmentId);
//   if (appointment_error) {
//     res.status(400).json({ error: appointment_error.message });
//   }
//   const { update_availability_error } = await supabase
//     .from("provider_availability")
//     .update({ status: "available" })
//     .eq("id", appointment.provider_availability_id);
//   if (update_availability_error) {
//     res.status(400).json({ error: update_availability_error.message });
//   }
//   const { appointment_update_error } = await supabase
//     .from("appointments")
//     .update({ provider_availability_id: new_schedule_id })
//     .eq("id", appointmentId);
//   if (appointment_update_error)
//     res.status(400).json({ error: appointment_update_error.message });
//   const { new_availability_error } = await supabase
//     .from("provider_availability")
//     .update({ status: "booked" })
//     .eq("id", new_schedule_id);
//   if (new_availability_error) {
//     res.status(400).json({ error: new_availability_error.message });
//   }
//   res.json({ message: "Appointment rescheduled successfully" });
// });

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
