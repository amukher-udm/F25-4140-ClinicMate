function DoctorScene() {
    return (
      <svg viewBox="0 0 560 340" className="about-art" aria-hidden="true">
        <rect x="0" y="0" width="560" height="340" rx="22" fill="#EEF2FF"/>
        <rect x="56" y="60" width="124" height="16" rx="8" fill="#DDE3FF"/>
        <circle cx="206" cy="200" r="56" fill="#C7D2FE"/>
        <rect x="274" y="172" width="200" height="18" rx="9" fill="#DDE3FF"/>
        <rect x="274" y="200" width="160" height="16" rx="8" fill="#E5E7FF"/>
        <rect x="150" y="250" width="260" height="12" rx="6" fill="#DDE3FF"/>
      </svg>
    );
  }
  
  export default function AboutSection() {
    return (
      <section className="about">
        <div className="about-grid">
          <DoctorScene />
          <div className="about-copy">
            <h3>Who is ClinicMate?</h3>
            <p className="muted">
              Founded in 2025 and headquartered in Ann Arbor, ClinicMate is a digital-first
              health platform connecting patients with trusted providers, urgent care, and
              personalized health dashboards. Our mission: blend modern technology with
              compassionate care to expand access for families.
            </p>
            <button className="btn btn-primary-outline">Learn more about us</button>
          </div>
        </div>
      </section>
    );
  }