function Card({ icon, title, desc }) {
    return (
      <div className="card">
        <div className="card-icon" aria-hidden="true">{icon}</div>
        <div>
          <div className="card-title">{title}</div>
          <div className="card-desc">{desc}</div>
        </div>
      </div>
    );
  }
  
  const Dot = () => (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill="#C7D2FE"/>
    </svg>
  );
  
  const Pin = () => (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <path d="M14 3c5 0 9 3.8 9 8.5C23 18 14 25 14 25S5 18 5 11.5C5 6.8 9 3 14 3z" fill="#C7D2FE"/>
      <circle cx="14" cy="11.5" r="3.5" fill="#6366F1"/>
    </svg>
  );
  
  const Portal = () => (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <rect x="4" y="6" width="20" height="16" rx="3" fill="#E0E7FF"/>
      <rect x="8" y="10" width="12" height="2" rx="1" fill="#6366F1"/>
      <rect x="8" y="14" width="10" height="2" rx="1" fill="#94A3B8"/>
    </svg>
  );
  
  export default function FeatureGrid() {
    return (
      <section className="features">
        <h2 className="sr-only">Helpful resources</h2>
        <div className="features-grid">
          <Card icon={<Dot />} title="Our services" desc="Care options & clinics" />
          <Card icon={<Dot />} title="Urgent care" desc="Walk-in & same day" />
          <Card icon={<Pin />} title="Our locations" desc="Find providers near you" />
          <Card icon={<Portal />} title="My Portal" desc="Records & messages" />
        </div>
      </section>
    );
  }