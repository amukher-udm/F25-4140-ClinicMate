import './AppointmentPage.css';
import { useEffect, useState, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';
import { listAppointments, cancelAppointment, rescheduleAppointment, getSlots } from '../../api/appointments';
import AvailabilityCalendar from '../../components//AppointmentCalendar/AvailabilityCalendar';

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
  
  // NEW: Search and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, doctor, hospital, status
  const [sortOrder, setSortOrder] = useState('desc'); // asc or desc
  const [listKey, setListKey] = useState(0); // Force re-render for animations
  
  const navigate = useNavigate();

  //Toast Notification State & Trigger
  const [toast, setToast] = useState({ show: false, message: '' }); 
  const showToast = (message) => { 
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000); // toast disappears after 3 seconds
  };

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

  // Trigger animation when sort or search changes
  useEffect(() => {
    setListKey(prev => prev + 1);
  }, [sortBy, sortOrder, searchQuery, filter]);

  const handleCancelAppointment = async () => {
    try {
      const token = getToken();
      await cancelAppointment(selectedAppointment.id, token);
      console.log('✅ Appointment cancelled successfully');
      showToast(`Appointment canceled for ${selectedAppointment.time}`);

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
      showToast(`Appointment rescheduled to ${newDate} ${availableSlots.find(s => s.id === selectedSlotId)?.slot_start}`);
      
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
        dateObj: dateObj, // Keep for sorting
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

  // Filter, search, and sort appointments
  const processedAppointments = useMemo(() => {
    let result = formatAppointments(appointments);

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(apt => 
        apt.doctor.toLowerCase().includes(query) ||
        apt.hospital.toLowerCase().includes(query) ||
        apt.specialty.toLowerCase().includes(query) ||
        apt.time.toLowerCase().includes(query) ||
        apt.status.toLowerCase().includes(query) ||
        (apt.notes && apt.notes.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = (a.dateObj || 0) - (b.dateObj || 0);
          break;
        case 'doctor':
          comparison = a.doctor.localeCompare(b.doctor);
          break;
        case 'hospital':
          comparison = a.hospital.localeCompare(b.hospital);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [appointments, searchQuery, sortBy, sortOrder, user]);

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
      {toast.show && <div className="toast-notification">{toast.message}</div>}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {/* Sort dropdown */}
            <div className="appointments-sort">
              <label htmlFor="sort-by" style={{ marginRight: '0.5rem', fontSize: '0.9rem', color: 'var(--slate-600)' }}>
                Sort by:
              </label>
              <select 
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  marginRight: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <option value="date">Date</option>
                <option value="doctor">Doctor</option>
                <option value="hospital">Hospital</option>
                <option value="status">Status</option>
              </select>
              
              <button
                onClick={() => {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  // Add rotation animation class
                  const btn = document.querySelector('.sort-toggle-btn');
                  if (btn) {
                    btn.classList.add('rotating');
                    setTimeout(() => btn.classList.remove('rotating'), 300);
                  }
                }}
                className="sort-toggle-btn"
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
                title={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            
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

          {/* Results count */}
          {searchQuery && (
            <p className="search-results-count" style={{ color: 'var(--slate-600)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Found {processedAppointments.length} result{processedAppointments.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}

          {processedAppointments.length === 0 ? (
            <div className="appointments-list" key={listKey}>
              <p style={{ textAlign: 'center', color: 'var(--slate-600)', padding: '2rem' }}>
                {searchQuery 
                  ? `No appointments found matching "${searchQuery}"`
                  : `No ${filter !== 'all' ? filter : ''} appointments found.`
                }
              </p>
            </div>
          ) : (
            <div className="appointments-list" key={listKey}>
              {processedAppointments.map((a, index) => (
                <div 
                  key={a.id} 
                  className="appointment-card"
                  style={{ 
                    cursor: (a.status === 'Scheduled' || a.status === 'Pending') ? 'pointer' : 'default',
                    animationDelay: `${Math.min(index * 0.05, 0.5)}s`
                  }}
                  onClick={() => {
                    if(a.status === 'Scheduled' || a.status === 'Pending') {
                      setSelectedAppointment(a);
                    }
                  }}
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