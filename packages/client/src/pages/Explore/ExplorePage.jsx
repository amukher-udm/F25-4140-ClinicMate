import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import supabase from '../../lib/supabaseClient';
import './ExplorePage.css';

// Default providers to show if Supabase is not connected or no data available
const defaultDoctors = [
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    specialty: 'Primary Care Physician',
    location: 'New York, NY',
    rating: 4.8,
    type: 'doctor',
  },
  {
    id: 2,
    name: 'Dr. Michael Chen',
    specialty: 'Cardiologist',
    location: 'Los Angeles, CA',
    rating: 4.9,
    type: 'doctor',
  },
  {
    id: 3,
    name: 'Dr. Emily Rodriguez',
    specialty: 'Pediatrician',
    location: 'Chicago, IL',
    rating: 4.7,
    type: 'doctor',
  },
  {
    id: 4,
    name: 'Dr. James Wilson',
    specialty: 'Orthopedic Surgeon',
    location: 'Houston, TX',
    rating: 4.8,
    type: 'doctor',
  },
  {
    id: 5,
    name: 'Dr. Lisa Anderson',
    specialty: 'Dermatologist',
    location: 'Miami, FL',
    rating: 4.9,
    type: 'doctor',
  },
  {
    id: 6,
    name: 'Dr. David Kim',
    specialty: 'Neurologist',
    location: 'Seattle, WA',
    rating: 4.6,
    type: 'doctor',
  },
];

const defaultHospitals = [
  {
    id: 101,
    name: 'Mount Sinai Hospital',
    specialty: 'General Hospital',
    location: 'New York, NY',
    rating: 4.7,
    type: 'hospital',
    beds: 1134,
  },
  {
    id: 102,
    name: 'Cedar-Sinai Medical Center',
    specialty: 'Academic Medical Center',
    location: 'Los Angeles, CA',
    rating: 4.8,
    type: 'hospital',
    beds: 886,
  },
  {
    id: 103,
    name: 'Northwestern Memorial Hospital',
    specialty: 'Teaching Hospital',
    location: 'Chicago, IL',
    rating: 4.6,
    type: 'hospital',
    beds: 894,
  },
  {
    id: 104,
    name: 'Houston Methodist Hospital',
    specialty: 'General Hospital',
    location: 'Houston, TX',
    rating: 4.9,
    type: 'hospital',
    beds: 948,
  },
  {
    id: 105,
    name: 'Jackson Memorial Hospital',
    specialty: 'Academic Medical Center',
    location: 'Miami, FL',
    rating: 4.5,
    type: 'hospital',
    beds: 1550,
  },
  {
    id: 106,
    name: 'University of Washington Medical Center',
    specialty: 'Teaching Hospital',
    location: 'Seattle, WA',
    rating: 4.7,
    type: 'hospital',
    beds: 450,
  },
];

export default function ExplorePage() {
  const [viewType, setViewType] = useState('doctors'); // 'doctors' or 'hospitals'
  const [displayedItems, setDisplayedItems] = useState(defaultDoctors);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Attempt to fetch data from Supabase based on view type
        const tableName = viewType === 'doctors' ? 'providers' : 'hospitals';
        const { data, error: fetchError } = await supabase
          .from(tableName)
          .select('*')
          .order('name', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        if (mounted && data && data.length > 0) {
          setDisplayedItems(data);
        } else if (mounted) {
          // Use default data if no data returned
          setDisplayedItems(viewType === 'doctors' ? defaultDoctors : defaultHospitals);
        }
      } catch (err) {
        console.warn(`Could not load ${viewType} from Supabase, using defaults:`, err.message);
        if (mounted) {
          setError('Using default data');
          setDisplayedItems(viewType === 'doctors' ? defaultDoctors : defaultHospitals);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [viewType]);

  const handleSearch = () => {
    // Filter items based on search term
    const sourceData = viewType === 'doctors' ? defaultDoctors : defaultHospitals;
    const filtered = sourceData.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setDisplayedItems(filtered.length > 0 ? filtered : sourceData);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleViewToggle = (type) => {
    setViewType(type);
    setSearchTerm('');
  };

  return (
    <>
      <Navbar />
      <main className="container">
        <section className="explore-hero">
          <h1>Find Your Healthcare Provider</h1>
          <p>Search through our network of trusted healthcare professionals and facilities</p>
          
          {/* View Toggle Switch */}
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewType === 'doctors' ? 'active' : ''}`}
              onClick={() => handleViewToggle('doctors')}
            >
              Doctors
            </button>
            <button
              className={`toggle-btn ${viewType === 'hospitals' ? 'active' : ''}`}
              onClick={() => handleViewToggle('hospitals')}
            >
              Hospitals
            </button>
          </div>

          <div className="search-container">
            <input
              type="text"
              placeholder={`Search ${viewType} by name, specialty, or location...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="btn btn-primary" onClick={handleSearch}>
              Search
            </button>
          </div>
          {error && <p className="error-message" style={{ color: 'var(--slate-500)', marginTop: '16px', fontSize: '0.875rem' }}>{error}</p>}
        </section>
        
        <section className="explore-grid">
          {loading ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--slate-600)' }}>
              Loading {viewType}...
            </p>
          ) : displayedItems.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--slate-600)' }}>
              No {viewType} found. Try a different search.
            </p>
          ) : (
            displayedItems.map((item) => (
              <div key={item.id} className={`provider-card ${item.type === 'hospital' ? 'hospital-card' : ''}`}>
                <h3>{item.name}</h3>
                <p>{item.specialty}</p>
                <p>📍 {item.location}</p>
                {item.beds && (
                  <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem' }}>
                    🛏️ {item.beds} beds
                  </p>
                )}
                {item.rating && (
                  <p style={{ color: 'var(--brand)', fontWeight: '600' }}>
                    ⭐ {item.rating}
                  </p>
                )}
                <button className="btn btn-secondary">View Profile</button>
              </div>
            ))
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
