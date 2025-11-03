import { useState } from "react";
import "../Auth.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-container">
      <h1>Login</h1>
      <form className="auth-form">
        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="Enter your email" required />
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="show-btn"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="form-options">
          <label>
            <input type="checkbox" /> Remember me
          </label>
          <a href="/forgot-password" className="forgot-password">
            Forgot password?
          </a>
        </div>

        <button type="submit" className="login-btn">
          Login
        </button>

        <div className="signup-button-container">
            <a href="/signup" className="signup-button">
                <u>Sign Up</u>
            </a>
        </div>
      </form>
    </div>
    
  );
}