import './AppointmentPage.css';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';

export default function AppointmentPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();


  useEffect(() => {
    fetch('/api/appointments')
      .then(res => res.json())
      .then(json => setData(json))
      .catch(() => setError(true));
  }, []);

  

  const appointments = [
    {
      id: 1,
      name: 'John Doe',
      doctor: 'Dr. Doe - Cardiology',
      time: '10:00 A.M October 10, 2025',
      status: 'Confirmed',
      // avatar: '/avatars/avatar1.png'
    },
    {
      id: 2,
      name: 'John Smith',
      doctor: 'Dr. Smith - Neurology',
      time: '12:00 P.M October 15, 2025',
      status: 'Pending',
      // avatar: '/avatars/avatar2.png'
    },
    {
      id: 3,
      name: 'Emily Johnson',
      doctor: 'Dr. Johnson - Orthopedics',
      time: '06:07 P.M October 31, 2025',
      status: 'Cancelled',
      // avatar: '/avatars/avatar3.png'
    },
  ];

  const filteredAppointments = appointments.filter(a =>
    filter === 'All' ? true : a.status === filter
  );


  return (
    <>
      <Navbar />
      <main className="container">
        <section className="appointments-section">
          <h1 className="appointments-title">Appointments</h1>

          <div className="appointments-controls">
            <input
              type="text"
              placeholder="Search" // Search functionality to be implemented, placeholder for now
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

          <div className="appointments-list">
            {filteredAppointments.map(a => (
              <div key={a.id} className="appointment-card">
                <div className="appointment-info">
                  <img src={a.avatar} alt="" className="appointment-avatar" />
                  <div>
                    <h3 className="appointment-name">{a.name}</h3>
                    <p className="appointment-doctor">{a.doctor}</p>
                    <p className="appointment-time">{a.time}</p>
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
