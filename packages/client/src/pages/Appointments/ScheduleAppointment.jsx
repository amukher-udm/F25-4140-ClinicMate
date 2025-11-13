import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import './ScheduleAppointment.css';
import { useAuth } from '../../state/AuthContext.jsx';
import WizardShell from '../../components/AppointmentWizard/WizardShell.jsx';
import { useAppointmentFlow } from '../../state/AppointmentContext.jsx';
import { createAppointment, getSlots } from '../../api/appointments.js';

const isoToday = () => new Date().toISOString().slice(0, 10);
const slotFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

const formatSlotLabel = (slot) => {
  if (!slot?.start) return 'Unavailable';
  return slotFormatter.format(new Date(slot.start));
};

export default function ScheduleAppointmentPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const navigate = useNavigate();
  const { state, actions } = useAppointmentFlow();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slotOptions, setSlotOptions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(isoToday());
  const [slotFetchNonce, setSlotFetchNonce] = useState(0);

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
    reason: '',
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
        const profileRes = await fetch('/api/profile_data', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const patient = profileData.patients;
          actions.setMeta({ patientId: patient.patient_id });
          setFormData((prev) => ({
            ...prev,
            firstName: patient.first_name || '',
            lastName: patient.last_name || '',
            email: patient.email || '',
            phone: patient.phone_number || '',
            postalCode: patient.address?.zip_code || '',
          }));
        }

        const exploreRes = await fetch('/api/explore_page');
        if (exploreRes.ok) {
          const exploreData = await exploreRes.json();
          setSpecialties(
            exploreData.doctors?.map((d) => d.specialty).filter(Boolean) || []
          );
          setHospitals(exploreData.hospitals || []);
          setDoctors(exploreData.doctors || []);
        }
      } catch (error) {
        console.error('Error loading booking data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authLoading, user, navigate, getToken, actions]);

  useEffect(() => {
    if (!state.provider) return;
    let cancelled = false;

    const loadSlots = async () => {
      try {
        actions.setLoading(true);
        const token = getToken();
        const data = await getSlots(
          { providerId: state.provider.id, date: selectedDate },
          token
        );
        if (!cancelled) {
          setSlotOptions(data.slots || []);
          actions.setError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setSlotOptions([]);
          actions.setError(error.message || 'Failed to load availability.');
        }
      } finally {
        actions.setLoading(false);
      }
    };

    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [state.provider, selectedDate, getToken, actions, slotFetchNonce]);

  const uniqueSpecialties = useMemo(
    () =>
      Array.from(
        new Map(
          specialties.map((s) => [
            s?.specialty_id || s?.id || s?.name,
            s,
          ])
        ).values()
      ),
    [specialties]
  );

  const providerVisitTypes = useMemo(() => {
    if (!state.provider) return uniqueSpecialties;
    const doctor = doctors.find(
      (doc) => String(doc.doctor_id) === String(state.provider.id)
    );
    return doctor?.specialty ? [doctor.specialty] : uniqueSpecialties;
  }, [state.provider, doctors, uniqueSpecialties]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'reason') {
      actions.setNotes(value);
    }
  };

  const handleProviderSelect = (doctor) => {
    actions.selectProvider({
      id: doctor.doctor_id,
      name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
      specialty: doctor.specialty?.specialty_name,
      hospital: doctor.hospital?.name,
      hospitalAddress: doctor.hospital?.address,
    });
    actions.setMeta({ doctor });
  };

  const handleVisitTypeSelect = (visitType) => {
    actions.selectVisitType({
      id: visitType.specialty_id || visitType.id || visitType.name,
      name: visitType.specialty_name || visitType.name,
    });
    setFormData((prev) => ({
      ...prev,
      appointmentType: visitType.specialty_name || visitType.name,
    }));
  };

  const handleSlotSelect = (slot) => {
    actions.selectSlot(slot);
    const localValue = slot.start
      ? slot.start.slice(0, 16)
      : '';
    setFormData((prev) => ({
      ...prev,
      scheduleTime: localValue,
    }));
  };

  const refreshSlots = () => {
    if (!state.provider) return;
    setSlotFetchNonce((count) => count + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!state.provider) {
      actions.setError('Select a provider to continue.');
      actions.goToStep('provider');
      return;
    }
    if (!state.visitType) {
      actions.setError('Choose a visit type to continue.');
      actions.goToStep('visitType');
      return;
    }
    if (!state.slot) {
      actions.setError('Pick a time slot before confirming.');
      actions.goToStep('slot');
      return;
    }

    // inside handleSubmit, before the try block returns
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  actions.setMeta({ confirmationId: `temp-${Date.now()}`, status: 'pending' });
  actions.goToStep('confirmation');
  return;
}


    try {
      setSubmitting(true);
      const token = getToken();
      const payload = {
        providerId: state.provider.id,
        patientId: user?.patientId,
        visitTypeId: state.visitType.id,
        slotId: state.slot.slotId,
        notes: formData.reason,
        metadata: {
          source: 'web',
          hospitalId: formData.location,
        },
        patientDetails: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
        },
      };

      const response = await createAppointment(payload, token);
      actions.setMeta({
        confirmationId: response.appointmentId,
        status: response.status,
      });
      actions.goToStep('confirmation');
    } catch (error) {
      if (error.status === 404) {
        console.info(
          'Appointments API not ready. Storing optimistic confirmation.'
        );
        actions.setMeta({
          confirmationId: `temp-${Date.now()}`,
          status: 'pending',
        });
        actions.goToStep('confirmation');
      } else {
        actions.setError(error.message);
        alert(error.message || 'Failed to create appointment.');
      }
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
          <p>Loading booking experience...</p>
        </main>
        <Footer />
      </>
    );
  }

  const renderProviderStep = () => (
    <>
      <p className="wizard-hint">
        Choose a provider to see the visit types and availability they offer.
      </p>
      <div className="provider-grid">
        {doctors.map((doctor) => (
          <div
            key={doctor.doctor_id}
            className={`provider-card ${
              state.provider?.id === doctor.doctor_id ? 'selected' : ''
            }`}
          >
            <h3>{`Dr. ${doctor.first_name} ${doctor.last_name}`}</h3>
            <p>{doctor.specialty?.specialty_name || 'General Practice'}</p>
            <p className="provider-meta">
              {doctor.hospital?.name && `@ ${doctor.hospital.name}`}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleProviderSelect(doctor)}
            >
              {state.provider?.id === doctor.doctor_id ? 'Selected' : 'Select'}
            </button>
          </div>
        ))}
      </div>
    </>
  );

  const renderVisitTypeStep = () => (
    <>
      <p className="wizard-hint">
        Visit types are contextual to the provider. Pick the reason for your
        visit.
      </p>
      <div className="visit-type-grid">
        {providerVisitTypes.map((specialty) => {
          const name = specialty?.specialty_name || specialty?.name;
          if (!name) return null;
          const isSelected = state.visitType?.name === name;
          return (
            <button
              type="button"
              key={specialty.specialty_id || specialty.id || name}
              className={`visit-type-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleVisitTypeSelect(specialty)}
            >
              {name}
            </button>
          );
        })}
      </div>
    </>
  );

  const renderSlotStep = () => (
    <>
      <div className="slot-toolbar">
        <label>
          Date
          <input
            type="date"
            value={selectedDate}
            min={isoToday()}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn btn-primary-outline"
          onClick={refreshSlots}
          disabled={state.loading}
        >
          Refresh Slots
        </button>
      </div>
      {state.error && (
        <div className="wizard-error">
          <span>{state.error}</span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={refreshSlots}
            disabled={state.loading}
          >
            Try Again
          </button>
        </div>
      )}
      <div className="slot-grid">
        {slotOptions.length === 0 && (
          <p className="wizard-hint">
            No slots found for this day. Try another date.
          </p>
        )}
        {slotOptions.map((slot) => (
          <button
            key={slot.slotId}
            type="button"
            className={`slot-card ${
              state.slot?.slotId === slot.slotId ? 'selected' : ''
            }`}
            onClick={() => handleSlotSelect(slot)}
          >
            <span>{formatSlotLabel(slot)}</span>
            <small>{state.provider?.hospital || 'Clinic'}</small>
          </button>
        ))}
      </div>
    </>
  );

  const renderReviewStep = () => (
    <form className="appointment-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <input
          name="firstName"
          placeholder="First Name *"
          value={formData.firstName}
          onChange={handleFieldChange}
          required
        />
        <input
          name="lastName"
          placeholder="Last Name *"
          value={formData.lastName}
          onChange={handleFieldChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email *"
          value={formData.email}
          onChange={handleFieldChange}
          required
        />
        <input
          name="postalCode"
          placeholder="Postal Code *"
          value={formData.postalCode}
          onChange={handleFieldChange}
          required
        />
        <input
          name="phone"
          placeholder="Phone (xxx-xxx-xxxx) *"
          value={formData.phone}
          onChange={handleFieldChange}
          required
        />
        <input
          name="dob"
          type="date"
          placeholder="Date of Birth *"
          value={formData.dob}
          onChange={handleFieldChange}
          required
        />
        <select
          name="gender"
          value={formData.gender}
          onChange={handleFieldChange}
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
          onChange={handleFieldChange}
          required
        >
          <option value="">Type of Appointment *</option>
          {uniqueSpecialties.map((specialty) => (
            <option
              key={specialty.specialty_id || specialty.id}
              value={specialty.specialty_name}
            >
              {specialty.specialty_name}
            </option>
          ))}
        </select>
        <select
          name="location"
          value={formData.location}
          onChange={handleFieldChange}
          required
        >
          <option value="">Preferred Location *</option>
          {hospitals.map((hospital) => (
            <option
              key={hospital.hospital_id}
              value={hospital.hospital_id}
            >
              {hospital.name}
              {hospital.address &&
                ` - ${hospital.address.city}, ${hospital.address.state}`}
            </option>
          ))}
        </select>
        <input
          name="scheduleTime"
          type="datetime-local"
          placeholder="Scheduled time"
          value={formData.scheduleTime}
          onChange={handleFieldChange}
          required
        />
        <textarea
          name="reason"
          placeholder="Reason for appointment / Diagnosis"
          value={formData.reason}
          onChange={handleFieldChange}
          style={{ gridColumn: '1 / -1' }}
        ></textarea>
      </div>

      <button
        type="submit"
        className="submit-btn"
        disabled={submitting}
      >
        {submitting ? 'Submitting...' : 'Confirm Appointment'}
      </button>
    </form>
  );

  const renderConfirmationStep = () => (
    <div className="confirmation-state">
      <h2>Appointment Requested</h2>
      <p>
        Confirmation:{' '}
        <strong>{state.meta.confirmationId || 'Pending assignment'}</strong>
      </p>
      <p>Status: {state.meta.status || 'Pending'}</p>
      <div className="confirmation-actions">
        <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
          View My Appointments
        </button>
        <button className="btn btn-secondary" onClick={() => actions.reset()}>
          Book Another
        </button>
      </div>
    </div>
  );

  const stepContent = {
    provider: renderProviderStep(),
    visitType: renderVisitTypeStep(),
    slot: renderSlotStep(),
    review: renderReviewStep(),
    confirmation: renderConfirmationStep(),
  };

  

  return (
    <>
      <Navbar />
      <main className="schedule-container">
        <WizardShell
          title="Request an Appointment"
          subtitle={
            state.provider
              ? `${state.provider.name} - ${state.provider?.hospital || 'Clinic'}`
              : 'Complete the steps to confirm your booking'
          }
        >
          {stepContent[state.step]}
        </WizardShell>
      </main>
      <Footer />
    </>
  );
}
