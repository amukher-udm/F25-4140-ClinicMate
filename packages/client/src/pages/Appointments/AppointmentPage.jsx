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
                <div key={a.id} className="appointment-card">
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
      <Footer />
    </>
  );
}