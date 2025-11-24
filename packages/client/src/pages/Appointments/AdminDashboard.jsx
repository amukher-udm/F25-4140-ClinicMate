import { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import { listAppointments, cancelAppointment, rescheduleAppointment } from '../../api/appointments.js';
import './AdminDashboard.css';
import { useAuth } from '../../state/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, loading: authLoading, getToken } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
  }, [authLoading, user, navigate]);

  // Fetch appointments for admin
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const data = await listAppointments({ status: 'all', sortBy, order: 'asc' }, token);

        console.log('Appointments API response:', data);

        // Handle Supabase-style response or plain array
        if (Array.isArray(data)) {
          setAppointments(data);
        } else if (Array.isArray(data.data)) {
          setAppointments(data.data);
        } else {
          setAppointments([]);
        }
      } catch (err) {
        setError('Failed to load appointments.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [getToken, sortBy]);

  // Cancel appointment
  const handleCancel = useCallback(async (id) => {
    try {
      const token = getToken();
      await cancelAppointment(id, token);
      setAppointments(prev => prev.filter(appt => appt.id !== id));
    } catch (err) {
      alert('Error cancelling appointment.');
    }
  }, [getToken]);

  // Reschedule appointment
  const handleReschedule = useCallback(async (id) => {
    try {
      const token = getToken();
      await rescheduleAppointment(id, { /* payload for new date/time */ }, token);
      alert('Reschedule flow triggered for appointment ' + id);
    } catch (err) {
      alert('Error rescheduling appointment.');
    }
  }, [getToken]);

  return (
    <>
      <Navbar />
      <main className="admin-dashboard">
        <h1 className="appointments-title">Admin Dashboard</h1>

        <div className="appointments-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Date</option>
            <option value="provider">Provider</option>
          </select>
        </div>

        {loading && <p className="loading">Loading appointments...</p>}
        {error && <p className="error">{error}</p>}

        <div className="appointments-list">
          {appointments.length === 0 && !loading && (
            <p>No appointments found.</p>
          )}
          {appointments.map(appt => (
            <div key={appt.id} className="appointment-card">
              <div className="appointment-info">
                <p className="appointment-name">{appt.patientName || 'Unknown Patient'}</p>
                <p className="appointment-provider">Provider: {appt.provider || 'N/A'}</p>
                <p className="appointment-time">
                  {appt.slot?.date} {appt.slot?.slot_start} - {appt.slot?.slot_end}
                </p>
              </div>
              <div className="actions">
                <button className="btn cancel" onClick={() => handleCancel(appt.id)}>Cancel</button>
                <button className="btn reschedule" onClick={() => handleReschedule(appt.id)}>Reschedule</button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
