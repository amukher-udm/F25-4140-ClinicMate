import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import './ScheduleAppointment.css';
import { useAuth } from '../../state/AuthContext.jsx';

export default function ScheduleAppointmentPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [specialties, setSpecialties] = useState([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    preferredDate: '',
    preferredTime: '',
    appointmentType: '',
    provider: '',
    location: '',
    reasonForVisit: '',
    insuranceProvider: '',
    insuranceId: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        const token = getToken();
        
        // Load patient profile
        const profileRes = await fetch('/api/profile_data', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const patient = profileData.patients;
          setFormData((prev) => ({
            ...prev,
            firstName: patient.first_name || '',
            lastName: patient.last_name || '',
            email: patient.email || '',
            phone: patient.phone_number || '',
          }));
        }

        // Load doctors and hospitals
        const exploreRes = await fetch('/api/explore_page');
        if (exploreRes.ok) {
          const exploreData = await exploreRes.json();
          setDoctors(exploreData.doctors || []);
          setHospitals(exploreData.hospitals || []);
          
          // Extract unique specialties
          const uniqueSpecs = Array.from(
            new Set(
              exploreData.doctors
                ?.map((d) => d.specialty?.specialty_name)
                .filter(Boolean)
            )
          );
          setSpecialties(uniqueSpecs);
        }
      } catch (error) {
        console.error('Error loading appointment data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authLoading, user, navigate, getToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = getToken();
      
      // In development, just show success message
      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          setSuccess(true);
          setSubmitting(false);
        }, 1000);
        return;
      }

      // In production, make API call
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          patientId: user.patientId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create appointment');
      }

      setSuccess(true);
    } catch (error) {
      console.error('Error submitting appointment:', error);
      alert('Failed to schedule appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <main className="schedule-page">
          <div className="schedule-content">
            <div className="loading-state">
              <p>Loading appointment form...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (success) {
    return (
      <>
        <Navbar />
        <main className="schedule-page">
          <div className="schedule-content">
            <div className="success-card">
              <div className="success-icon">✓</div>
              <h2>Appointment Request Submitted</h2>
              <p>
                Thank you for scheduling with ClinicMate. We've received your
                appointment request and will contact you shortly to confirm your
                appointment time.
              </p>
              <p className="confirmation-note">
                A confirmation email has been sent to <strong>{formData.email}</strong>
              </p>
              <div className="success-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/appointments')}
                >
                  View My Appointments
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSuccess(false);
                    setFormData({
                      ...formData,
                      preferredDate: '',
                      preferredTime: '',
                      appointmentType: '',
                      provider: '',
                      location: '',
                      reasonForVisit: '',
                    });
                  }}
                >
                  Schedule Another
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="schedule-page">
        <div className="schedule-content">
          <div className="page-header">
            <h1>Schedule an Appointment</h1>
            <p className="page-subtitle">
              Please fill out the form below and we'll contact you to confirm your appointment.
            </p>
          </div>

          <form className="appointment-form-simple" onSubmit={handleSubmit}>
            {/* Patient Information */}
            <section className="form-section">
              <h2 className="section-title">Patient Information</h2>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="dateOfBirth">Date of Birth *</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="gender">Gender *</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(123) 456-7890"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Appointment Details */}
            <section className="form-section">
              <h2 className="section-title">Appointment Details</h2>
              
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="appointmentType">Type of Visit *</label>
                  <select
                    id="appointmentType"
                    name="appointmentType"
                    value={formData.appointmentType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select visit type...</option>
                    {specialties.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                    <option value="General Checkup">General Checkup</option>
                    <option value="Follow-up">Follow-up Visit</option>
                    <option value="New Patient">New Patient Consultation</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="provider">Preferred Provider</label>
                  <select
                    id="provider"
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                  >
                    <option value="">Any available provider</option>
                    {doctors.map((doc) => (
                      <option key={doc.doctor_id} value={doc.doctor_id}>
                        Dr. {doc.first_name} {doc.last_name} - {doc.specialty?.specialty_name || 'General'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="location">Preferred Location *</label>
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select location...</option>
                    {hospitals.map((hospital) => (
                      <option key={hospital.hospital_id} value={hospital.hospital_id}>
                        {hospital.name}
                        {hospital.address && ` - ${hospital.address.city}, ${hospital.address.state}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="preferredDate">Preferred Date *</label>
                  <input
                    type="date"
                    id="preferredDate"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="preferredTime">Preferred Time *</label>
                  <select
                    id="preferredTime"
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select time...</option>
                    <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
                    <option value="afternoon">Afternoon (12:00 PM - 5:00 PM)</option>
                    <option value="evening">Evening (5:00 PM - 8:00 PM)</option>
                  </select>
                </div>
              </div>

              <div className="form-field full-width">
                <label htmlFor="reasonForVisit">Reason for Visit *</label>
                <textarea
                  id="reasonForVisit"
                  name="reasonForVisit"
                  value={formData.reasonForVisit}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Please briefly describe the reason for your visit..."
                  required
                />
              </div>
            </section>

            {/* Insurance Information */}
            <section className="form-section">
              <h2 className="section-title">Insurance Information (Optional)</h2>
              
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="insuranceProvider">Insurance Provider</label>
                  <input
                    type="text"
                    id="insuranceProvider"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleChange}
                    placeholder="e.g., Blue Cross, Aetna, UnitedHealthcare"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="insuranceId">Insurance ID / Member Number</label>
                  <input
                    type="text"
                    id="insuranceId"
                    name="insuranceId"
                    value={formData.insuranceId}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/appointments')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Request Appointment'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
