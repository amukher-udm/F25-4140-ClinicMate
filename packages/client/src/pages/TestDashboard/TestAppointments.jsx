import { useMemo, useState } from 'react';
import './TestAppointments.css';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'canceled', label: 'Canceled' },
];

const MOCK_APPOINTMENTS = [
  {
    id: 'appt-1',
    status: 'upcoming',
    doctor: 'Dr. Nguyen',
    specialty: 'Pediatrics',
    hospital: 'General Hospital',
    location: 'Ann Arbor, MI',
    datetime: '2025-11-19T10:00:00Z',
    notes: 'Bring lab results',
  },
  {
    id: 'appt-2',
    status: 'upcoming',
    doctor: 'Dr. Smith',
    specialty: 'Neurology',
    hospital: 'Lakeside Hospital',
    location: 'Toledo, OH',
    datetime: '2025-11-25T14:30:00Z',
    notes: 'Follow-up visit',
  },
  {
    id: 'appt-3',
    status: 'canceled',
    doctor: 'Dr. Patel',
    specialty: 'Cardiology',
    hospital: 'Corewell',
    location: 'Detroit, MI',
    datetime: '2025-10-12T09:00:00Z',
    notes: 'Canceled by patient',
  },
];

const formatDate = (isoString) =>
  new Date(isoString).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

export default function TestAppointments() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(
    () => MOCK_APPOINTMENTS.filter((appt) => appt.status === activeTab),
    [activeTab]
  );

  const selectAppointment = (appt) => setSelected(appt);
  const closeModal = () => setSelected(null);

  return (
    <div className="test-layout">
      <nav className="test-nav">
        <div className="test-nav-brand">ClinicMate Sandbox</div>
        <div className="test-nav-links">
          <span>Home</span>
          <span>Patients</span>
          <span>Providers</span>
        </div>
      </nav>

      <header className="test-hero">
        <h1>Appointment Sandbox</h1>
        <p>Preview tabs, filters, and detail actions for the dashboard.</p>
      </header>

      <section className="test-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`test-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              setSelected(null);
            }}
          >
            {tab.label} (
              {MOCK_APPOINTMENTS.filter((a) => a.status === tab.id).length}
            )
          </button>
        ))}
      </section>

      <main className="test-main">
        {filtered.length === 0 ? (
          <p className="test-empty">No {activeTab} appointments.</p>
        ) : (
          filtered.map((appt) => (
            <article
              key={appt.id}
              className="test-card"
              onClick={() => selectAppointment(appt)}
            >
              <div>
                <p className="test-card-date">{formatDate(appt.datetime)}</p>
                <h3>{appt.doctor} &bull; {appt.specialty}</h3>
                <p>{appt.hospital} &bull; {appt.location}</p>
              </div>
              <span className={`test-status ${appt.status}`}>
                {appt.status}
              </span>
            </article>
          ))
        )}
      </main>

      {selected && (
        <div className="test-modal-backdrop" onClick={closeModal}>
          <div
            className="test-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="test-modal-header">
              <div>
                <p className="test-card-date">{formatDate(selected.datetime)}</p>
                <h2>{selected.doctor}</h2>
                <p>{selected.specialty}</p>
              </div>
              <button onClick={closeModal} aria-label="Close modal">
                &times;
              </button>
            </header>
            <div className="test-modal-body">
              <p>{selected.hospital} &bull; {selected.location}</p>
              <p>Notes: {selected.notes || 'None'}</p>
            </div>
            <div className="test-modal-actions">
              <button className="test-btn outline">Add Note</button>
              <button className="test-btn primary">Reschedule</button>
              <button className="test-btn danger">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <footer className="test-footer">
        <p>© {new Date().getFullYear()} ClinicMate Sandbox. For mockup use only.</p>
      </footer>
    </div>
  );
}
