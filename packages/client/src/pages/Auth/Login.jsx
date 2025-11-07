import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext.jsx';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ open: false, message: '' });

  const justSignedUp = location.state?.justSignedUp;
  const [form, setForm] = useState({
    email: location.state?.email || '',
    password: ''
  });

  useEffect(() => {
    // page enter animation
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (justSignedUp) window.history.replaceState({}, '');
  }, [justSignedUp]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setModal({ open: false, message: '' }); };
    if (modal.open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal.open]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    const res = login(form);
    setSubmitting(false);

    if (!res.ok) {
      setModal({ open: true, message: res.error || 'Invalid email or password.' });
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="auth-screen">
    <div className={`auth-container ${mounted ? 'cm-auth-enter' : ''}`}>
      <h1 className="cm-fade-in" style={{ animationDelay: '80ms' }}>Log In</h1>
      {justSignedUp && (
        <p className="info-text cm-fade-in" style={{ animationDelay: '160ms' }}>
          Account created — please log in.
        </p>
      )}

      <form className="auth-form">
        {/* Email */}
        <div className="form-group cm-field-in" style={{ animationDelay: '120ms' }}>
          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={onChange}
            required
          />
        </div>

        {/* Password */}
        <div className="form-group cm-field-in" style={{ animationDelay: '220ms', position: 'relative' }}>
          <label>Password</label>
          <div className="password-field">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={onChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="show-btn"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Options row */}
        <div className="form-options cm-fade-in" style={{ animationDelay: '300ms' }}>
          <label>
            <input type="checkbox" /> Remember me
          </label>
          <a href="/forgot-password" className="forgot-password">Forgot password?</a>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="login-btn cm-press"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? 'Signing in…' : 'Login'}
        </button>

        {/* Sign up link */}
        <div className="signup-button-container cm-fade-in" style={{ animationDelay: '380ms' }}>
          <a href="/signup" className="signup-button"><u>Sign Up</u></a>
        </div>

        {/* Demo users note */}
        <div className="demo-note cm-fade-in" style={{ animationDelay: '440ms' }}>
          <strong>Demo users:</strong><br />
          admin@clinicmate.demo / <code>admin</code><br />
          admin1@clinicmate.demo / <code>admin1</code>
        </div>
      </form>
      </div>

      {/* Error Modal */}
      {modal.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="cm-modal-overlay"
          onClick={() => setModal({ open: false, message: '' })}
        >
          <div
            className="cm-modal-panel cm-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="cm-modal-title">Invalid email or password, try again.</h2>
            {/* (message available if you want to show more details) */}
            {/* <p className="cm-modal-text">{modal.message}</p> */}
            <div className="cm-modal-actions cm-actions-center">
              <button
                className="btn btn-pill btn-primary"
                onClick={() => setModal({ open: false, message: '' })}
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
