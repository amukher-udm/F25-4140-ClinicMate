// packages/client/src/pages/Auth/Signup.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext.jsx';
import './Auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // page enter animation
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const res = register(form);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || 'Could not create account.');
      return;
    }

    // Do NOT auto-login; redirect to Login page
    navigate('/login', { replace: true, state: { justSignedUp: true, email: form.email } });
  };

  return (
    <div className="auth-screen">
      <div className={`auth-container ${mounted ? 'cm-auth-enter' : ''}`}>
        <h1 className="cm-fade-in" style={{ animationDelay: '80ms' }}>Sign Up</h1>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group cm-field-in" style={{ animationDelay: '120ms' }}>
            <label>First Name</label>
            <input
              name="firstName" type="text" placeholder="First name"
              value={form.firstName} onChange={onChange} required
            />
          </div>

          <div className="form-group cm-field-in" style={{ animationDelay: '180ms' }}>
            <label>Last Name</label>
            <input
              name="lastName" type="text" placeholder="Last name"
              value={form.lastName} onChange={onChange} required
            />
          </div>

          <div className="form-group cm-field-in" style={{ animationDelay: '240ms' }}>
            <label>Email</label>
            <input
              name="email" type="email" placeholder="Enter your email"
              value={form.email} onChange={onChange} required
            />
          </div>

          <div className="form-group cm-field-in" style={{ animationDelay: '300ms', position: 'relative' }}>
            <label>Password</label>
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

          {error && <p className="error-text cm-fade-in">{error}</p>}

          <button type="submit" className="signup-btn cm-press" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Account'}
          </button>

          <p className="switch-text cm-fade-in" style={{ animationDelay: '380ms' }}>
            Already have an account? <a href="/login" className="link">Log in</a>
          </p>
        </form>
      </div>
    </div>
  );
}