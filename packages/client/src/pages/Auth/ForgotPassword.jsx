import "./Auth.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../state/AuthContext.jsx";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ open: false, message: '', isSuccess: false });
  
  const [form, setForm] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });

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

  const onSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.email || !form.newPassword || !form.confirmPassword) {
      setModal({ open: true, message: 'Please fill in all fields.', isSuccess: false });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setModal({ open: true, message: 'Passwords do not match.', isSuccess: false });
      return;
    }

    if (form.newPassword.length < 3) {
      setModal({ open: true, message: 'Password must be at least 3 characters.', isSuccess: false });
      return;
    }

    setSubmitting(true);

    const res = resetPassword({ email: form.email, newPassword: form.newPassword });
    setSubmitting(false);

    if (!res.ok) {
      setModal({ open: true, message: res.error || 'Unable to reset password. Please check your email.', isSuccess: false });
      return;
    }

    // Success - show success modal and redirect after 5 seconds
    setModal({ open: true, message: 'Password has been reset successfully!', isSuccess: true });
    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 5000);
  };

  return (
    <div className="auth-screen">
      <div className={`auth-container ${mounted ? 'cm-auth-enter' : ''}`}>
        <h1 className="cm-fade-in" style={{ animationDelay: '80ms' }}>Reset Password</h1>
        
        <form className="auth-form" onSubmit={onSubmit}>
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

          <div className="form-group cm-field-in" style={{ animationDelay: '200ms', position: 'relative' }}>
            <label>New Password</label>
            <div className="password-field">
              <input
                name="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={form.newPassword}
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

          <div className="form-group cm-field-in" style={{ animationDelay: '280ms', position: 'relative' }}>
            <label>Confirm New Password</label>
            <div className="password-field">
              <input
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={onChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="show-btn"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="reset-btn cm-press" 
            disabled={submitting}
            style={{ animationDelay: '360ms' }}
          >
            {submitting ? 'Resetting…' : 'Reset Password'}
          </button>

          <p className="switch-text cm-fade-in" style={{ animationDelay: '440ms' }}>
            Remembered your password?{" "}
            <a href="/login" className="link">
              Log in
            </a>
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
                Redirecting to login in 5 seconds...
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