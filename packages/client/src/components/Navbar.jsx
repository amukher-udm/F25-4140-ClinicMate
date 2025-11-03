import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="nav-wrap">
      <div className="nav container">
        {/* Brand logo */}
        <Link className="brand" to="/" aria-label="ClinicMate home">
          <span className="brand-mark" />
          <span className="brand-name">ClinicMate</span>
        </Link>

        {/* Navigation links */}
        <nav className="nav-links" aria-label="Primary">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Home
          </Link>
          <a href="#explore">Explore</a>
          <a href="#appointments">Appointments</a>
          <Link
            to="/profile"
            className={location.pathname === '/profile' ? 'active' : ''}
          >
            Profile
          </Link>
          <a href="#help">Help</a>
        </nav>

        {/* Login button */}
        <button className="btn btn-pill btn-primary-outline">Portal Login</button>
      </div>
    </header>
  );
}
