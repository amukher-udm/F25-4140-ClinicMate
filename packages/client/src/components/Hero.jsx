function CalendarIcon() {
    return (
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
        <rect x="6" y="12" width="60" height="54" rx="12" fill="#E0E7FF"/>
        <rect x="6" y="20" width="60" height="12" rx="2" fill="#C7D2FE"/>
        <circle cx="24" cy="44" r="5" fill="#6366F1"/>
        <circle cx="48" cy="44" r="5" fill="#6366F1"/>
      </svg>
    );
  }
  
  function ProfileCard() {
    return (
      <svg width="280" height="180" viewBox="0 0 280 180" aria-hidden="true">
        <rect x="0" y="0" width="280" height="180" rx="14" fill="#EEF2FF"/>
        <rect x="24" y="24" width="232" height="24" rx="6" fill="#DDE3FF"/>
        <circle cx="70" cy="108" r="28" fill="#C7D2FE"/>
        <rect x="112" y="88" width="120" height="16" rx="4" fill="#DDE3FF"/>
        <rect x="112" y="112" width="96" height="14" rx="4" fill="#E5E7FF"/>
      </svg>
    );
  }
  
  export default function Hero() {
    return (
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <h1>Your go to compassionate care for you and your family</h1>
            <p className="muted">
              ClinicMate helps you feel your best. Excellent, affordable care delivered with kindness.
              Find doctors, urgent care, and manage your health in one place.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary">Find a Doctor</button>
            </div>
          </div>
  
          <div className="hero-art">
            <div className="hero-card">
              <div className="hero-art-row">
                <CalendarIcon />
                <ProfileCard />
              </div>
              <div className="hero-avatar">
                {/* simple illustration avatar */}
                <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden="true">
                  <circle cx="55" cy="55" r="55" fill="#E0E7FF"/>
                  <circle cx="55" cy="48" r="18" fill="#A5B4FC"/>
                  <rect x="26" y="70" width="58" height="22" rx="11" fill="#C7D2FE"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }