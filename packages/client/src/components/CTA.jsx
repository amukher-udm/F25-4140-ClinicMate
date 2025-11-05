import { Link } from 'react-router-dom';

export default function CTA() {
    return (
      <section className="cta">
        <div className="cta-bar">
          <div>
            <div className="cta-title">Continue your care</div>
            <div className="cta-sub">Need a specialist? Browse doctors and clinics.</div>
          </div>
          <Link to="/explore" className="btn btn-primary-outline">Explore providers</Link>
        </div>
      </section>
    );
  }