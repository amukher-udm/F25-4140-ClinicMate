import './HomePage.css';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import FeatureGrid from '../../components/FeatureGrid';
import AboutSection from '../../components/AboutSection';
import CTA from '../../components/CTA';
import Footer from '../../components/Footer';

export default function HomePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(json => setData(json))
      .catch(() => setError(true));
  }, []);

  return (
    <>
      <Navbar data={data} error={error} />
      <main className="container">
        <Hero />
        <FeatureGrid />
        <AboutSection />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
