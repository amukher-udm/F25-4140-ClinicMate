import { useState, useEffect, useRef } from 'react';
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
  const [modal, setModal] = useState({ open: false, message: '', isSuccess: false });
  const [showPassword, setShowPassword] = useState(false);
  
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    // page enter animation
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => { 
      if (e.key === 'Escape') setModal({ open: false, message: '', isSuccess: false }); 
    };
    if (modal.open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal.open]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmittingRef.current || submitting) {
      console.log('⚠️ Already submitting, ignoring duplicate request');
      return;
    }
    
    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      const res = await register(form);

      if (!res.ok) {
        setModal({ 
          open: true, 
          message: res.error || 'Could not create account.', 
          isSuccess: false 
        });
        isSubmittingRef.current = false;
        setSubmitting(false);
        return;
      }

      // Success - show email verification message
      setModal({ 
        open: true, 
        message: 'Account created successfully! Please check your email to verify your account before logging in.', 
        isSuccess: true 
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          replace: true, 
          state: { justSignedUp: true, email: form.email } 
        });
      }, 3000);
    } catch (err) {
      console.error('Signup error:', err);
      setModal({ 
        open: true, 
        message: 'An unexpected error occurred.', 
        isSuccess: false 
      });
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className={`auth-container ${mounted ? 'cm-auth-enter' : ''}`}>
        <h1 className="cm-fade-in" style={{ animationDelay: '80ms' }}>Sign Up</h1>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group cm-field-in" style={{ animationDelay: '120ms' }}>
            <label>First Name</label>
            <input
              name="firstName" 
              type="text" 
              placeholder="First name"
              value={form.firstName} 
              onChange={onChange} 
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group cm-field-in" style={{ animationDelay: '180ms' }}>
            <label>Last Name</label>
            <input
              name="lastName" 
              type="text" 
              placeholder="Last name"
              value={form.lastName} 
              onChange={onChange}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group cm-field-in" style={{ animationDelay: '240ms' }}>
            <label>Email</label>
            <input
              name="email" 
              type="email" 
              placeholder="Enter your email"
              value={form.email} 
              onChange={onChange}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group cm-field-in" style={{ animationDelay: '300ms', position: 'relative' }}>
            <label>Password</label>
            <div className="password-field">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={onChange}
                disabled={submitting}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="show-btn"
                disabled={submitting}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="signup-btn cm-press" 
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create Account'}
          </button>

          <p className="switch-text cm-fade-in" style={{ animationDelay: '380ms' }}>
            Already have an account? <a href="/login" className="link">Log in</a>
          </p>
        </form>
      </div>

      {/* Modal */}
      {modal.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="cm-modal-overlay"
          onClick={() => !modal.isSuccess && setModal({ open: false, message: '', isSuccess: false })}
        >
          <div
            className="cm-modal-panel cm-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="cm-modal-title">
              {modal.isSuccess ? '✓ Success' : 'Error'}
            </h2>
            <p className="cm-modal-text">{modal.message}</p>
            {modal.isSuccess && (
              <p className="cm-modal-text" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Redirecting to login in 3 seconds...
              </p>
            )}
            <div className="cm-modal-actions cm-actions-center">
              {!modal.isSuccess && (
                <button
                  className="btn btn-pill btn-primary"
                  onClick={() => setModal({ open: false, message: '', isSuccess: false })}
                  autoFocus
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}