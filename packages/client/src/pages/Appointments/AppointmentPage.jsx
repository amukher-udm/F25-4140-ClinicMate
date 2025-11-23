import './AppointmentPage.css';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';
import { listAppointments, cancelAppointment, rescheduleAppointment, getSlots } from '../../api/appointments';
import AvailabilityCalendar from '../../components/AppointmentCalendar/AvailabilityCalendar';

export default function AppointmentPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const navigate = useNavigate();

  // Fetch appointments from backend
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await listAppointments({ status: filter }, token);
      console.log('📋 Appointments fetched:', response);
      setAppointments(response.data || []);
      setError(false);
    } catch (err) {
      console.error('❌ Error fetching appointments:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    fetchAppointments();
  }, [user, authLoading, navigate, filter]);

  // Fetch available slots when date changes in reschedule modal
  useEffect(() => {
    if (showRescheduleModal && newDate && selectedAppointment) {
      const fetchSlots = async () => {
        try {
          setLoadingSlots(true);
          const token = getToken();
          const slots = await getSlots({
            providerId: selectedAppointment.provider_id,
            date: newDate
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
    }
  }, [newDate, showRescheduleModal, selectedAppointment]);

  const handleCancelAppointment = async () => {
    try {
      const token = getToken();
      await cancelAppointment(selectedAppointment.id, token);
      console.log('✅ Appointment cancelled successfully');
      
      // Refresh appointments list
      await fetchAppointments();
      
      setShowCancelConfirmation(false);
      setSelectedAppointment(null);
    } catch (err) {
      console.error('❌ Error cancelling appointment:', err);
      alert('Failed to cancel appointment: ' + err.message);
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!selectedSlotId) {
      alert('Please select a time slot');
      return;
    }

    try {
      const token = getToken();
      await rescheduleAppointment(
        selectedAppointment.id,
        { new_slot_id: selectedSlotId },
        token
      );
      console.log('✅ Appointment rescheduled successfully');
      
      // Refresh appointments list
      await fetchAppointments();
      
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setNewDate('');
      setSelectedSlotId('');
      setAvailableSlots([]);
    } catch (err) {
      console.error('❌ Error rescheduling appointment:', err);
      alert('Failed to reschedule appointment: ' + err.message);
    }
  };

  // Format appointment data for display
  const formatAppointments = (appointments) => {
    return appointments.map(apt => {
      const date = apt.slot?.date || '';
      const startTime = apt.slot?.slot_start || '';
      const endTime = apt.slot?.slot_end || '';
      
      // Format date and time for display
      const dateObj = date ? new Date(date) : null;
      const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }) : '';
      
      const timeStr = startTime ? `${formatTime(startTime)}` : '';
      
      const hospitalName = apt.hospital?.name || 'Medical Center';
      const hospitalCity = apt.hospital?.address?.city || '';
      const hospitalState = apt.hospital?.address?.state || '';
      const hospitalAddress = hospitalCity && hospitalState 
        ? `${hospitalCity}, ${hospitalState}` 
        : '';

      // Get doctor name from the joined doctor table
      const doctorFirstName = apt.doctor?.first_name || '';
      const doctorLastName  = apt.doctor?.last_name  || '';
      const doctorName = doctorFirstName && doctorLastName 
        ? `Dr. ${doctorFirstName} ${doctorLastName}`
        : `Provider #${apt.provider_id}`;

      const specialty = apt.doctor?.specialty?.specialty_name || 'General Practice';

return {
        id: apt.id,
        appointmentId: apt.id,
        provider_id: apt.provider_id,
        slot_id: apt.slot_id,
        patientName: user.name,
        doctor: doctorName,
        specialty: specialty,
        hospital: hospitalName,
        hospitalAddress: hospitalAddress,
        time: `${timeStr} ${dateStr}`,
        date: date,
        startTime: startTime,
        endTime: endTime,
        status: apt.status ? apt.status.charAt(0).toUpperCase() + apt.status.slice(1) : 'Unknown',
        visitType: apt.visit_type,
        notes: apt.notes || apt.reason,
      };
    });
  };

  // Helper to format time from 24-hour to 12-hour format
  const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'P.M' : 'A.M';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formattedAppointments = formatAppointments(appointments);

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
              {['all', 'scheduled', 'completed', 'cancelled'].map(tab => (
                <button
                  key={tab}
                  className={`btn btn-pill filter-btn ${filter === tab ? 'active' : ''}`}
                  onClick={() => setFilter(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {formattedAppointments.length === 0 ? (
            <div className="appointments-list">
              <p style={{ textAlign: 'center', color: 'var(--slate-600)', padding: '2rem' }}>
                No {filter !== 'all' ? filter : ''} appointments found.
              </p>
            </div>
          ) : (
            <div className="appointments-list">
              {formattedAppointments.map(a => (
                <div 
                  key={a.id} 
                  className="appointment-card"
                  onClick={() => {
                    if(a.status === 'Scheduled' || a.status === 'Pending') {
                      setSelectedAppointment(a);
                    }
                  }}
                  style={{ cursor: (a.status === 'Scheduled' || a.status === 'Pending') ? 'pointer' : 'default' }}
                >
                  <div className="appointment-info">
                    <div>
                      <h3 className="appointment-name">{a.patientName}</h3>
                      <p className="appointment-doctor">
                        {a.doctor}
                        {a.specialty && <span style={{ color: 'var(--slate-500)', fontSize: '0.9em' }}> • {a.specialty}</span>}
                      </p>
                      <p className="appointment-hospital">
                        🏥 {a.hospital}
                        {a.hospitalAddress && ` - ${a.hospitalAddress}`}
                      </p>
                      <p className="appointment-time">📅 {a.time}</p>
                      {a.visitType && <p className="appointment-visit-type">Visit: {a.visitType.replace('_', ' ')}</p>}
                    </div>
                  </div>
                  <span
                    className={`appointment-status ${a.status.toLowerCase()}`}
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
            <p><strong>Doctor:</strong> {selectedAppointment.doctor}</p>
            {selectedAppointment.specialty && <p><strong>Specialty:</strong> {selectedAppointment.specialty}</p>}
            <p><strong>Hospital:</strong> {selectedAppointment.hospital} {selectedAppointment.hospitalAddress && `- ${selectedAppointment.hospitalAddress}`}</p>
            <p><strong>Date & Time:</strong> {selectedAppointment.time}</p>
            {selectedAppointment.visitType && <p><strong>Visit Type:</strong> {selectedAppointment.visitType.replace('_', ' ')}</p>}
            {selectedAppointment.notes && <p><strong>Notes:</strong> {selectedAppointment.notes}</p>}
            <div className="modal-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowRescheduleModal(true);
                  setSelectedAppointment(prev => ({ ...prev }));
                }}
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
            <p><strong>Doctor:</strong> {selectedAppointment.doctor}</p>
            {selectedAppointment.specialty && <p><strong>Specialty:</strong> {selectedAppointment.specialty}</p>}
            <p><strong>Hospital:</strong> {selectedAppointment.hospital}{' '}
              {selectedAppointment.hospitalAddress && `- ${selectedAppointment.hospitalAddress}`}
            </p>
            <p><strong>Date & Time:</strong> {selectedAppointment.time}</p>
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
          onClick={() => {
            setShowRescheduleModal(false);
            setNewDate('');
            setSelectedSlotId('');
            setAvailableSlots([]);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div 
            className="cancel-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <button
              className="cancel-modal-close-btn"
              onClick={() => {
                setShowRescheduleModal(false);
                setNewDate('');
                setSelectedSlotId('');
                setAvailableSlots([]);
              }}
            >
              ✕
            </button>

            <h2>Reschedule Appointment</h2>

            <p><strong>Doctor:</strong> {selectedAppointment.doctor}</p>
            {selectedAppointment.specialty && <p><strong>Specialty:</strong> {selectedAppointment.specialty}</p>}
            <p><strong>Hospital:</strong> {selectedAppointment.hospital} {selectedAppointment.hospitalAddress && `- ${selectedAppointment.hospitalAddress}`}</p>
            <p><strong>Current Time:</strong> {selectedAppointment.time}</p>

            <div className="reschedule-inputs">
              <AvailabilityCalendar
                providerId={selectedAppointment.provider_id}
                onDateSelect={(date) => {
                  setNewDate(date);
                  setSelectedSlotId('');
                }}
                selectedDate={newDate}
                getToken={getToken}
              />

              {newDate && (
                <label style={{ marginTop: '1rem' }}>
                  Available Time Slots:
                  {loadingSlots ? (
                    <p>Loading available slots...</p>
                  ) : availableSlots.length === 0 ? (
                    <p>No available slots for this date</p>
                  ) : (
                    <select
                      value={selectedSlotId}
                      onChange={(e) => setSelectedSlotId(e.target.value)}
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
                </label>
              )}
            </div>

            <div className="cancel-modal-actions">
              <button 
                className="btn btn-primary"
                onClick={handleRescheduleAppointment}
                disabled={!selectedSlotId || loadingSlots}
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