import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home/HomePage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import ExplorePage from './pages/Explore/ExplorePage.jsx';
import './index.css';
import './styles/theme.css';
import Login from './pages/Auth/Login.jsx';
import ForgotPassword from './pages/Auth/ForgotPassword.jsx';
import Signup from './pages/Auth/Signup.jsx';
import { AuthProvider } from './state/AuthContext.jsx';
import { AppointmentProvider } from './state/AppointmentContext.jsx';
import HelpPage from './pages/Help/HelpPage.jsx';
import PrivacyPolicy from './pages/Legal/PrivacyPolicy.jsx';
import Terms from './pages/Legal/Terms.jsx';
import AppointmentPage from './pages/Appointments/AppointmentPage.jsx';
import ScheduleAppointment from './pages/Appointments/ScheduleAppointment.jsx';
import TestAppointments from './pages/TestDashboard/TestAppointments.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AppointmentProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/Profile" element={<ProfilePage />} />
            <Route path="/Explore" element={<ExplorePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/appointments" element={<AppointmentPage />} />
            <Route path="/Schedule" element={<ScheduleAppointment />} />
            <Route path="/test" element={<TestAppointments />} />
          </Routes>
        </Router>
      </AppointmentProvider>
    </AuthProvider>
  </React.StrictMode>
);
