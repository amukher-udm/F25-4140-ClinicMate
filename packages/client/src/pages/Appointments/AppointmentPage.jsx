import './AppointmentPage.css';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';

export default function AppointmentPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('All');
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const token = getToken();
        const res = await fetch('/api/explore_page', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        const json = await res.json();
        const allDoctors = json.doctors || [];
        
        // Deterministically select 3 doctors based on patient ID
        const patientIdNum = parseInt(user.patientId) || 1;
        const selectedDoctors = [];
        
        for (let i = 0; i < Math.min(3, allDoctors.length); i++) {
          const index = (patientIdNum + i * 7) % allDoctors.length;
          selectedDoctors.push(allDoctors[index]);
        }
        
        setDoctors(selectedDoctors);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError(true);
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, navigate, getToken]);

  // Generate appointments from the fetched doctors for this specific user
  const appointments = doctors.map((doctor, index) => {
    const statuses = ['Confirmed', 'Pending', 'Cancelled'];
    const dates = [
      '10:00 A.M November 15, 2025',
      '02:30 P.M November 20, 2025',
      '04:00 P.M November 25, 2025'
    ];
    
    const doctorName = `${doctor.first_name} ${doctor.last_name}`;
    const specialty = doctor.specialty?.specialty_name || 'General Practice';
    const hospital = doctor.hospital?.name || 'Medical Center';
    const hospitalAddress = doctor.hospital?.address 
      ? `${doctor.hospital.address.city}, ${doctor.hospital.address.state}`
      : '';

    return {
      id: `${user.patientId}-${doctor.doctor_id}`,
      patientName: user.name,
      doctor: `Dr. ${doctor.last_name} - ${specialty}`,
      hospital: hospital,
      hospitalAddress: hospitalAddress,
      time: dates[index % dates.length],
      status: statuses[index % statuses.length],
    };
  });

  const filteredAppointments = appointments.filter(a =>
    filter === 'All' ? true : a.status === filter
  );

  const handleCancelAppointment = () => {

    setShowCancelConfirmation(false);
    setSelectedAppointment(null);
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <main className="container">
          <section className="appointments-section">
            <h1 className="appointments-title">My Appointments</h1>
            <p>Loading your appointments...</p>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="container">
          <section className="appointments-section">
            <h1 className="appointments-title">My Appointments</h1>
            <p>Error loading appointments. Please try again later.</p>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container">
        <section className="appointments-section">
          <h1 className="appointments-title">My Appointments</h1>
          <p style={{ color: 'var(--slate-600)', marginBottom: '1rem' }}>
            Welcome back, {user.name}
          </p>

          <div className="appointments-controls">
            <input
              type="text"
              placeholder="Search appointments..."
              className="appointments-search"
            />
            <div className="appointments-filters">
              {['All', 'Confirmed', 'Pending', 'Cancelled'].map(tab => (
                <button
                  key={tab}
                  className={`btn btn-pill filter-btn ${filter === tab ? 'active' : ''}`}
                  onClick={() => setFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="appointments-list">
              <p style={{ textAlign: 'center', color: 'var(--slate-600)', padding: '2rem' }}>
                No {filter.toLowerCase()} appointments found.
              </p>
            </div>
          ) : (
            <div className="appointments-list">
              {filteredAppointments.map(a => (
                <div 
                  key={a.id} 
                  className="appointment-card"
                  onClick={() => {
                    if(a.status === 'Pending' || a.status === 'Confirmed') {
                      setSelectedAppointment({
                        doctorName: a.doctor,
                        doctorSpecialty: a.doctor.split(' - ')[1],
                        hospital: a.hospital,
                        hospitalAddress: a.hospitalAddress,
                        time: a.time
                      });
                    }
                  }}
                  style={{ cursor: (a.status === 'Pending' || a.status === 'Confirmed') ? 'pointer' : 'default' }}
                >

                  <div className="appointment-info">
                    <div>
                      <h3 className="appointment-name">{a.patientName}</h3>
                      <p className="appointment-doctor">{a.doctor}</p>
                      <p className="appointment-hospital">
                        🏥 {a.hospital}
                        {a.hospitalAddress && ` - ${a.hospitalAddress}`}
                      </p>
                      <p className="appointment-time">📅 {a.time}</p>
                    </div>
                  </div>
                  <span
                    className={`appointment-status ${
                      a.status.toLowerCase()
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
        <div className="scheduleAppointment-container">
          <button
            className="scheduleAppointment-btn"
            onClick={() => navigate('/Schedule')}
          >
            Schedule Appointment
          </button>
        </div>
      </main>

      {selectedAppointment && (
        <div className="appointment-modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="appointment-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedAppointment(null)}>✕</button>
            <h2>Appointment Details</h2>
            <p><strong>Doctor:</strong> {selectedAppointment.doctorName}</p>
            {/* <p><strong>Specialty:</strong> {selectedAppointment.doctorSpecialty}</p> */}
            <p><strong>Hospital:</strong> {selectedAppointment.hospital} {selectedAppointment.hospitalAddress && `- ${selectedAppointment.hospitalAddress}`}</p>
            <p><strong>Date & Time:</strong> {selectedAppointment.time}</p>
            <div className="modal-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setShowRescheduleModal(true)}
              >
                Reschedule
              </button>
              <button 
                className="btn btn-cancel" 
                onClick={() => setShowCancelConfirmation(true)}
              >
                Cancel
            </button>
            </div>
          </div>
        </div>
      )}

      {showCancelConfirmation && selectedAppointment && (
        <div
          className="cancel-modal-overlay"
          onClick={() => setShowCancelConfirmation(false)}
        >
          <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="cancel-modal-close-btn"
              onClick={() => setShowCancelConfirmation(false)}
            >
              ✕
            </button>
            <h2>Cancel Appointment</h2>
            <p>
              <strong>Doctor:</strong> {selectedAppointment.doctorName}
            </p>
            <p>
              <strong>Specialty:</strong> {selectedAppointment.doctorSpecialty}
            </p>
            <p>
              <strong>Hospital:</strong> {selectedAppointment.hospital}{' '}
              {selectedAppointment.hospitalAddress &&
                `- ${selectedAppointment.hospitalAddress}`}
            </p>
            <p>
              <strong>Date & Time:</strong> {selectedAppointment.time}
            </p>
            <p className="cancel-confirmation-text">
              Are you sure that you would like to cancel this appointment?
            </p>
            <div className="cancel-modal-actions">
              <button
                className="btn-cancel-appointment"
                onClick={handleCancelAppointment}
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {showRescheduleModal && selectedAppointment && (
        <div
          className="cancel-modal-overlay"
          onClick={() => setShowRescheduleModal(false)}
        >
          <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="cancel-modal-close-btn"
              onClick={() => setShowRescheduleModal(false)}
            >
              ✕
            </button>

            <h2>Reschedule Appointment</h2>

            <p><strong>Doctor:</strong> {selectedAppointment.doctorName}</p>
            {/* <p><strong>Specialty:</strong> {selectedAppointment.doctorSpecialty}</p> */}
            <p><strong>Hospital:</strong> {selectedAppointment.hospital} {selectedAppointment.hospitalAddress && `- ${selectedAppointment.hospitalAddress}`}</p>
            <p><strong>Current Time:</strong> {selectedAppointment.time}</p>

            <div className="reschedule-inputs">
              <label>
                New Date:
                <input 
                  type="date" 
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </label>

              <label>
                New Time:
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                >
                  <option value="">Select a time...</option>
                  <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
                  <option value="afternoon">Afternoon (12:00 PM - 5:00 PM)</option>
                  <option value="evening">Evening (5:00 PM - 8:00 PM)</option>
                </select>
              </label>
            </div>

            <div className="cancel-modal-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  // For now, just close modal. Later: Update backend.
                  setShowRescheduleModal(false);
                  setSelectedAppointment(null);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}


      <Footer />
    </>
  );
}