import "./Auth.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../state/AuthContext.jsx";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ open: false, message: '', isSuccess: false });
  
  const [form, setForm] = useState({
    email: ''
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

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.email) {
      setModal({ open: true, message: 'Please enter your email address.', isSuccess: false });
      return;
    }

    setSubmitting(true);

    const res = await resetPassword({ email: form.email });
    setSubmitting(false);

    if (!res.ok) {
      setModal({ 
        open: true, 
        message: res.error || 'Unable to send reset email. Please check your email address.', 
        isSuccess: false 
      });
      return;
    }

    // Success - show success message
    setModal({ 
      open: true, 
      message: 'Password reset link has been sent to your email! Please check your inbox and follow the instructions.', 
      isSuccess: true 
    });
    
    // Redirect to login after 5 seconds
    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 5000);
  };

  return (
    <div className="auth-screen">
      <div className={`auth-container ${mounted ? 'cm-auth-enter' : ''}`}>
        <h1 className="cm-fade-in" style={{ animationDelay: '80ms' }}>Reset Password</h1>
        <p className="info-text cm-fade-in" style={{ animationDelay: '120ms' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group cm-field-in" style={{ animationDelay: '160ms' }}>
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

          <button 
            type="submit" 
            className="reset-btn cm-press" 
            disabled={submitting}
            style={{ animationDelay: '240ms' }}
          >
            {submitting ? 'Sending…' : 'Send Reset Link'}
          </button>

          <p className="switch-text cm-fade-in" style={{ animationDelay: '320ms' }}>
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
              {modal.isSuccess ? '✓ Email Sent' : 'Error'}
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