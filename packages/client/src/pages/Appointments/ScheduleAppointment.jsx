import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './ScheduleAppointment.css';
import { useState } from 'react';

export default function ScheduleAppointmentPage() {
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // TODO: Send data to API
  };

  return (
    <>
      <Navbar />
      <main className="schedule-container">
        <h1 className="page-title">Request an Appointment</h1>
        <p className="required-note">Required fields are indicated with *</p>

        <form className="appointment-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <input name="firstName" placeholder="First Name *" value={formData.firstName} onChange={handleChange} required />
            <input name="lastName" placeholder="Last Name *" value={formData.lastName} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email *" value={formData.email} onChange={handleChange} required />
            <input name="postalCode" placeholder="Postal Code *" value={formData.postalCode} onChange={handleChange} required />
            <input name="phone" placeholder="Phone (xxx-xxx-xxxx) *" value={formData.phone} onChange={handleChange} required />
            <input name="dob" type="date" placeholder="Date of Birth *" value={formData.dob} onChange={handleChange} required />

            <select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="">Select Gender *</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <select name="appointmentType" value={formData.appointmentType} onChange={handleChange} required>
              <option value="">Type of Appointment *</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Orthopedics">Orthopedics</option>
            </select>

            <select name="location" value={formData.location} onChange={handleChange} required>
              <option value="">Preferred Location *</option>
              <option value="Clinic A">Clinic A</option>
              <option value="Clinic B">Clinic B</option>
            </select>

            <input name="scheduleTime" type="datetime-local" placeholder="Schedule a time" value={formData.scheduleTime} onChange={handleChange} required />
            <textarea name="reason" placeholder="Reason for appointment/Diagnosis" value={formData.reason} onChange={handleChange}></textarea>
          </div>

          <button type="submit" className="submit-btn">Submit</button>
        </form>
      </main>
      <Footer />
    </>
  );
}