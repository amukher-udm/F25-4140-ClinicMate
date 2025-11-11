import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './ScheduleAppointment.css';
import { useAuth } from '../../state/AuthContext';

export default function ScheduleAppointmentPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    postalCode: '',
    phone: '',
    dob: '',
    gender: '',
    appointmentType: '',
    location: '',
    scheduleTime: '',
    reason: ''
  });

  // Load user data and options
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        const token = getToken();

        // Load user profile data
        const profileRes = await fetch('/api/profile_data', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const patient = profileData.patients;

          // Autofill form with user data
          setFormData(prev => ({
            ...prev,
            firstName: patient.first_name || '',
            lastName: patient.last_name || '',
            email: patient.email || '',
            phone: patient.phone_number || '',
            postalCode: patient.address?.zip_code || '',
            gender: '', // Add gender to patients table if you want to autofill
          }));
        }

        // Load specialties and hospitals
        const exploreRes = await fetch('/api/explore_page');
        if (exploreRes.ok) {
          const exploreData = await exploreRes.json();
          setSpecialties(exploreData.doctors?.map(d => d.specialty).filter(Boolean) || []);
          setHospitals(exploreData.hospitals || []);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setLoading(false);
      }
    };

    loadData();
  }, [user, authLoading, navigate, getToken]);

  // Get unique specialties
  const uniqueSpecialties = Array.from(
    new Map(specialties.map(s => [s.specialty_id, s])).values()
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = getToken();
      const res = await fetch('/api/schedule_appointment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('Appointment request submitted successfully!');
        navigate('/appointments');
      } else {
        const error = await res.json();
        alert(`Failed to submit appointment: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error submitting appointment:', err);
      alert('Error submitting appointment request');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <main className="schedule-container">
          <h1 className="page-title">Request an Appointment</h1>
          <p>Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="schedule-container">
        <h1 className="page-title">Request an Appointment</h1>
        <p className="required-note">Required fields are indicated with *</p>

        <form className="appointment-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <input 
              name="firstName" 
              placeholder="First Name *" 
              value={formData.firstName} 
              onChange={handleChange} 
              required 
            />
            <input 
              name="lastName" 
              placeholder="Last Name *" 
              value={formData.lastName} 
              onChange={handleChange} 
              required 
            />
            <input 
              name="email" 
              type="email" 
              placeholder="Email *" 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
            <input 
              name="postalCode" 
              placeholder="Postal Code *" 
              value={formData.postalCode} 
              onChange={handleChange} 
              required 
            />
            <input 
              name="phone" 
              placeholder="Phone (xxx-xxx-xxxx) *" 
              value={formData.phone} 
              onChange={handleChange} 
              required 
            />
            <input 
              name="dob" 
              type="date" 
              placeholder="Date of Birth *" 
              value={formData.dob} 
              onChange={handleChange} 
              required 
            />

            <select 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange} 
              required
            >
              <option value="">Select Gender *</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
              <option value="Other">Other</option>
            </select>

            <select 
              name="appointmentType" 
              value={formData.appointmentType} 
              onChange={handleChange} 
              required
            >
              <option value="">Type of Appointment *</option>
              {uniqueSpecialties.map(specialty => (
                <option key={specialty.specialty_id} value={specialty.specialty_name}>
                  {specialty.specialty_name}
                </option>
              ))}
            </select>

            <select 
              name="location" 
              value={formData.location} 
              onChange={handleChange} 
              required
            >
              <option value="">Preferred Location *</option>
              {hospitals.map(hospital => (
                <option key={hospital.hospital_id} value={hospital.hospital_id}>
                  {hospital.name}
                  {hospital.address && ` - ${hospital.address.city}, ${hospital.address.state}`}
                </option>
              ))}
            </select>

            <input 
              name="scheduleTime" 
              type="datetime-local" 
              placeholder="Schedule a time" 
              value={formData.scheduleTime} 
              onChange={handleChange} 
              required 
            />
            <textarea 
              name="reason" 
              placeholder="Reason for appointment/Diagnosis" 
              value={formData.reason} 
              onChange={handleChange}
              style={{ gridColumn: '1 / -1' }}
            ></textarea>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}