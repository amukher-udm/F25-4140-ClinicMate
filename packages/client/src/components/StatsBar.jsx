import { useEffect, useState } from "react";

function CountUp({ to=0, dur=900 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const id = requestAnimationFrame(function tick(t){
      const p = Math.min((t - start)/dur, 1);
      setN(Math.round(p*to));
      if (p < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [to, dur]);
  return n;
}

export default function StatsBar(){
  return (
    <section className="container" style={{padding:"16px 0 6px"}}>
      <div className="features-grid">
        <div className="card"><div>
          <div className="card-title"><CountUp to={67}/>k+ patients</div>
          <div className="card-desc">served last year</div>
        </div></div>

        <div className="card"><div>
          <div className="card-title">4.9★ rating</div>
          <div className="card-desc">based on 6700 reviews</div>
        </div></div>

        <div className="card"><div>
          <div className="card-title"><CountUp to={67}/> providers</div>
          <div className="card-desc">across 21 clinics</div>
        </div></div>

        <div className="card"><div>
          <div className="card-title">99.98% uptime</div>
          <div className="card-desc">patient portal availability</div>
        </div></div>
      </div>
    </section>
  );
}
