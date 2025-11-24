import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import './ScheduleAppointment.css';
import { useAuth } from '../../state/AuthContext.jsx';
import { getSlots, createAppointment } from '../../api/appointments.js';
import AvailabilityCalendar from '../../components/AppointmentCalendar/AvailabilityCalendar.jsx';

export default function ScheduleAppointmentPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  
  // Slot selection state
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState('');

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

    const adminID = user?.patientId
    console.log('User role:', adminID);

    if (adminID === 74){
      navigate('/admin');
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

  // Fetch available slots when provider and date are selected
  useEffect(() => {
    if (formData.provider && formData.preferredDate) {
      const fetchSlots = async () => {
        try {
          setLoadingSlots(true);
          setSelectedSlotId('');
          const token = getToken();
          
          // Use the provider as the provider_id for fetching slots
          const slots = await getSlots({
            providerId: formData.provider,
            date: formData.preferredDate
          }, token);
          
          console.log('🕐 Available slots:', slots);
          setAvailableSlots(slots || []);
        } catch (err) {
          console.error('❌ Error fetching slots:', err);
          setAvailableSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    } else {
      setAvailableSlots([]);
      setSelectedSlotId('');
    }
  }, [formData.provider, formData.preferredDate, getToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSlotId) {
      alert('Please select a specific time slot for your appointment.');
      return;
    }
    
    setSubmitting(true);

    try {
      const token = getToken();
      
      // Map the form's appointmentType to backend's visit_type format
      let visit_type = formData.appointmentType;
      if (visit_type === 'General Checkup') visit_type = 'annual_physical';
      if (visit_type === 'Follow-up') visit_type = 'follow_up';
      if (visit_type === 'New Patient') visit_type = 'new_patient';
      // For specialties, use as sick_visit or keep as is
      if (!['new_patient', 'follow_up', 'annual_physical', 'sick_visit'].includes(visit_type)) {
        visit_type = 'sick_visit';
      }
      
      // Create appointment with backend-expected format
      const appointmentData = {
        slot_id: selectedSlotId,
        visit_type: visit_type,
        reason: formData.reasonForVisit,
      };
      
      console.log('📤 Submitting appointment:', appointmentData);
      
      const response = await createAppointment(appointmentData, token);
      console.log('✅ Appointment created:', response);
      
      setSuccess(true);
    } catch (error) {
      console.error('❌ Error submitting appointment:', error);
      alert(`Failed to schedule appointment: ${error.message || 'Please try again.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to format time from 24-hour to 12-hour format
  const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
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
              <h2>Appointment Scheduled Successfully!</h2>
              <p>
                Your appointment has been confirmed with ClinicMate.
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
                    setSelectedSlotId('');
                    setAvailableSlots([]);
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
              Please fill out the form below to schedule your appointment.
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
                    <option value="New Patient">New Patient Consultation</option>
                    <option value="Follow-up">Follow-up Visit</option>
                    <option value="General Checkup">Annual Physical / General Checkup</option>
                    <option value="sick_visit">Sick Visit</option>
                    {specialties.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec} Consultation
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="provider">Select Provider *</label>
                  <select
                    id="provider"
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a provider...</option>
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

              <div className="form-field full-width">
                <label htmlFor="preferredDate">Appointment Date *</label>
                <AvailabilityCalendar
                  providerId={formData.provider}
                  onDateSelect={(date) => {
                    setFormData(prev => ({ ...prev, preferredDate: date }));
                    setSelectedSlotId('');
                  }}
                  selectedDate={formData.preferredDate}
                  getToken={getToken}
                />
              </div>

              {/* Show available time slots */}
              {formData.provider && formData.preferredDate && (
                <div className="form-field full-width">
                  <label htmlFor="timeSlot">Available Time Slots *</label>
                  {loadingSlots ? (
                    <p style={{ color: 'var(--slate-600)', padding: '1rem' }}>
                      Loading available time slots...
                    </p>
                  ) : availableSlots.length === 0 ? (
                    <p style={{ color: 'var(--red-600)', padding: '1rem' }}>
                      No available time slots for this provider on this date. Please select a different date or provider.
                    </p>
                  ) : (
                    <select
                      id="timeSlot"
                      value={selectedSlotId}
                      onChange={(e) => setSelectedSlotId(e.target.value)}
                      required
                      style={{ width: '100%' }}
                    >
                      <option value="">Select a time slot...</option>
                      {availableSlots
                        .filter(slot => !slot.is_booked)
                        .map(slot => (
                          <option key={slot.id} value={slot.id}>
                            {formatTime(slot.slot_start)} - {formatTime(slot.slot_end)}
                          </option>
                        ))
                      }
                    </select>
                  )}
                </div>
              )}

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
                disabled={submitting || !selectedSlotId}
              >
                {submitting ? 'Scheduling...' : 'Schedule Appointment'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}