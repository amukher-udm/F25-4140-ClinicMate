import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthed, logout } = useAuth();

  return (
    <header className="nav-wrap">
      <div className="nav container">
        <NavLink className="brand" to="/" aria-label="ClinicMate home" end>
          <span className="brand-mark" />
          <span className="brand-name">ClinicMate</span>
        </NavLink>

        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/" end className={({isActive}) => (isActive ? "active" : "")}>
            Home
          </NavLink>
          <NavLink to="/explore" className={({isActive}) => (isActive ? "active" : "")}>
            Explore
          </NavLink>
          
          {/* Only show these links when user is authenticated */}
          {isAuthed && (
            <>
              <NavLink to="/appointments" className={({isActive}) => (isActive ? "active" : "")}>
                Appointments
              </NavLink>
              <NavLink to="/profile" className={({isActive}) => (isActive ? "active" : "")}>
                Profile
              </NavLink>
            </>
          )}
          
          <NavLink to="/help" className={({isActive}) => (isActive ? "active" : "")}>
            Help
          </NavLink>
        </nav>

        {isAuthed ? (
          <div className="nav-cta" style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-pill btn-primary" onClick={() => navigate('/appointments/new')}>
              New Appointment
            </button>
            <button className="btn btn-pill btn-primary-outline" onClick={() => { logout(); navigate('/'); }}>
              Sign Out
            </button>
          </div>
        ) : (
          <button className="btn btn-pill btn-primary-outline" onClick={() => navigate('/login')}>
            Portal Login
          </button>
        )}
      </div>
    </header>
  );
}