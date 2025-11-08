import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../state/AuthContext.jsx";
import "./ExplorePage.css";

/* ---------- Helpers ---------- */

const toName = (first, last) =>
  `${first ?? ""} ${last ?? ""}`.replace(/\s+/g, " ").trim() || null;

const formatLocation = (item) => {
  let city = null;
  let state = null;
  let street = null;

  // For hospitals: nested address object
  if (item.address && typeof item.address === 'object') {
    city = item.address.city;
    state = item.address.state;
    street = item.address.street;
  }

  // For doctors: nested through hospital.address
  if (item.hospital && typeof item.hospital === 'object') {
    if (item.hospital.address && typeof item.hospital.address === 'object') {
      city = item.hospital.address.city;
      state = item.hospital.address.state;
      street = item.hospital.address.street;
    }
  }

  if (city || state) return [city, state].filter(Boolean).join(", ");
  if (street) return street;
  
  return "—";
};

const getDisplayName = (item) => {
  const fromParts = toName(item.first_name, item.last_name);
  return item.name ?? fromParts ?? "—";
};

const getDisplaySpecialty = (item) => {
  // Check nested specialty object
  if (item.specialty && typeof item.specialty === "object") {
    return item.specialty.specialty_name || item.specialty.name || "—";
  }

  // If it's a hospital
  if (item.name || item.hospital_id) {
    return "Hospital";
  }

  return "—";
};

const getDisplayPhone = (item) => item.phone ?? item.phone_number ?? null;

const getDisplayEmail = (item) => item.email ?? null;

/* ---------- API fetcher ---------- */
async function fetchExploreData() {
  const res = await fetch("/api/explore_page");

  if (!res.ok) {
    let message = `Failed to load data (status ${res.status})`;
    try {
      const text = await res.text();
      if (text) message = text;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const json = await res.json();
  console.log("=== FIRST HOSPITAL ===");
  console.log(JSON.stringify(json.hospitals[0], null, 2));
  console.log("=== FIRST DOCTOR ===");
  console.log(JSON.stringify(json.doctors[0], null, 2));
  return { hospitals: json.hospitals ?? [], doctors: json.doctors ?? [] };
}

/* ---------------- Page ---------------- */
export default function ExplorePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const locationRouter = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", {
        replace: true,
        state: { from: locationRouter.pathname },
      });
    }
  }, [authLoading, user, navigate, locationRouter.pathname]);

  const [viewType, setViewType] = useState("doctors");
  const [doctors, setDoctors] = useState(null);
  const [hospitals, setHospitals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const { hospitals: hosps, doctors: docs } = await fetchExploreData();
        if (!cancelled) {
          setDoctors(docs);
          setHospitals(hosps);
          if (!docs.length && hosps.length) setViewType("hospitals");
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e.message || "Failed to load data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const list = useMemo(() => {
    const base = viewType === "doctors" ? doctors : hospitals;
    if (!base) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return base;

    return base.filter((item) => {
      const name = getDisplayName(item).toLowerCase();
      const specialty = getDisplaySpecialty(item).toLowerCase();
      const location = formatLocation(item).toLowerCase();
      return (
        name.includes(q) || specialty.includes(q) || location.includes(q)
      );
    });
  }, [viewType, doctors, hospitals, searchTerm]);

  const handleViewToggle = (type) => {
    if (type !== viewType) {
      setViewType(type);
      setSearchTerm("");
    }
  };

  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="container">
          <section className="explore-hero">
            <h1>Find Your Healthcare Provider</h1>
            <p>Loading your session…</p>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="container">
        <section className="explore-hero">
          <h1>Find Your Healthcare Provider</h1>
          <p>
            Search through our network of trusted healthcare professionals and
            facilities
          </p>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${
                viewType === "doctors" ? "active" : ""
              }`}
              onClick={() => handleViewToggle("doctors")}
            >
              Doctors
            </button>
            <button
              className={`toggle-btn ${
                viewType === "hospitals" ? "active" : ""
              }`}
              onClick={() => handleViewToggle("hospitals")}
            >
              Hospitals
            </button>
          </div>

          <div className="search-container">
            <input
              type="text"
              placeholder={`Search ${viewType} by name, specialty, or location...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
            <button className="btn btn-primary" onClick={() => null}>
              Search
            </button>
          </div>

          {errorMsg && (
            <p
              className="error-message"
              style={{
                color: "var(--slate-500)",
                marginTop: 16,
                fontSize: "0.875rem",
              }}
            >
              {errorMsg}
            </p>
          )}
        </section>

        <section className="explore-grid">
          {loading ? (
            <p
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                color: "var(--slate-600)",
              }}
            >
              Loading {viewType}...
            </p>
          ) : list.length === 0 ? (
            <p
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                color: "var(--slate-600)",
              }}
            >
              No {viewType} found.
            </p>
          ) : (
            list.map((item) => {
              const name = getDisplayName(item);
              const specialty = getDisplaySpecialty(item);
              const location = formatLocation(item);
              const email = getDisplayEmail(item);
              const phone = getDisplayPhone(item);

              return (
                <div
                  key={item.id ?? item.doctor_id ?? item.hospital_id}
                  className={`provider-card ${
                    item.type === "hospital" ? "hospital-card" : ""
                  }`}
                >
                  <h3>{name}</h3>
                  <p>{specialty}</p>
                  <p>📍 {location}</p>

                  {(email || phone) && (
                    <p
                      style={{
                        color: "var(--slate-600)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {email ? `✉️ ${email}` : ""}
                      {email && phone ? " • " : ""}
                      {phone ? `📞 ${phone}` : ""}
                    </p>
                  )}

                  <button className="btn btn-secondary">View Profile</button>
                </div>
              );
            })
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}