import "../Auth.css";
import { useState } from "react";

export default function ForgotPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="auth-container">
      <h1>Reset Password</h1>
      <form className="auth-form">
        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="Enter your email" required />
        </div>

        <div className="form-group">
          <label>New Password</label>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              required
            />
            <button
              type="button"
              className="show-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Confirm New Password</label>
          <div className="password-field">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              required
            />
            <button
              type="button"
              className="show-btn"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button type="submit" className="reset-btn">
          Reset Password
        </button>

        <p className="switch-text">
          Remembered your password?{" "}
          <a href="/login" className="link">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}