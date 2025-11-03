import "../Auth.css";

export default function Signup() {
  return (
    <div className="auth-container">
      <h1>Sign Up</h1>
      <form className="auth-form">
          <div className="form-group">
            <label>First Name</label>
            <input type="text" placeholder="First name" required />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input type="text" placeholder="Last name" required />
          </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="Enter your email" required />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="Enter your password" required />
        </div>

        <button type="submit" className="signup-btn">
          Create Account
        </button>

        <p className="switch-text">
          Already have an account?{" "}
          <a href="/login" className="link">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}