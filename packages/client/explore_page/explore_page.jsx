import React, { useState, useEffect } from 'react';
import styles from './explore_page.module.css';
import profileStyles from '../profile_page/profile_page.module.css';

// Custom hook for search/filter management
const useSearch = (initialView = 'hospitals') => {
  const [view, setView] = useState(initialView);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    openNow: false,
    acceptsInsurance: false,
    specialtyId: null,
  });
  const [results, setResults] = useState({
    loading: true,
    error: null,
    items: [],
    total: 0,
  });
  const [specialties, setSpecialties] = useState([]);

  useEffect(() => {
    // Fetch specialties from the API
    fetch('/api/specialties')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch specialties');
        return res.json();
      })
      .then(setSpecialties)
      .catch((error) => {
        console.error('Error fetching specialties:', error);
      });
  }, []);

  useEffect(() => {
    setResults((prev) => ({ ...prev, loading: true, error: null }));

    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (filters.specialtyId) params.append('specialtyId', filters.specialtyId);

    const endpoint = `/api/${view}?${params.toString()}`;

    fetch(endpoint)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${view}`);
        return res.json();
      })
      .then((data) => {
        setResults({
          loading: false,
          error: null,
          items: data[view] || [],
          total: data.total || 0,
        });
      })
      .catch((err) =>
        setResults({
          loading: false,
          error: err.message || 'Failed to load results',
          items: [],
          total: 0,
        })
      );
  }, [view, query, filters]);

  return {
    view,
    setView,
    query,
    setQuery,
    filters,
    setFilters,
    results,
    specialties,
  };
};

const ExplorePage = ({ setCurrentPage }) => {
  const search = useSearch();
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const handleNavClick = (page) => {
    if (setCurrentPage) {
      setCurrentPage(page.toLowerCase());
    }
  };

  const handleSpecialtyChange = (specialtyId) => {
    search.setFilters((prev) => ({
      ...prev,
      specialtyId: prev.specialtyId === specialtyId ? null : specialtyId,
    }));
  };

  const renderHospitalCard = (hospital) => (
    <div key={hospital.hospital_id} className={styles.resultCard}>
      <div className={styles.cardImage} />
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{hospital.hospital_name}</h3>
          <button
            className={styles.cardButton}
            onClick={() =>
              window.alert(`Viewing hospital: ${hospital.hospital_name}`)
            }
          >
            View
          </button>
        </div>
        <div className={styles.cardDetails}>{hospital.hospital_addr}</div>
        <div className={styles.details}>
          {hospital.open_hours && <span>Open: {hospital.open_hours}</span>}
          {hospital.phone && <span> • {hospital.phone}</span>}
        </div>
      </div>
    </div>
  );

  const renderDoctorCard = (doctor) => (
    <div key={doctor.doctor_id} className={styles.doctorCard}>
      <div
        className={styles.doctorAvatar}
        style={
          doctor.avatar_url
            ? { backgroundImage: `url(${doctor.avatar_url})`, backgroundSize: 'cover' }
            : undefined
        }
      />
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            Dr. {doctor.first_name} {doctor.last_name}
          </h3>
          <button
            className={styles.cardButton}
            onClick={() => setSelectedDoctor(doctor)}
          >
            Book
          </button>
        </div>
        <div className={styles.cardDetails}>
          {doctor.specialty?.specialty_name || doctor.title}
          {doctor.hospital && ` • ${doctor.hospital.hospital_name}`}
        </div>
        {selectedDoctor?.doctor_id === doctor.doctor_id && (
          <div className={styles.bookingPanel}>
            <h4>Schedule Appointment</h4>
            <p>Booking form coming soon...</p>
            <button
              className={styles.cardButton}
              onClick={() => setSelectedDoctor(null)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Global Header borrowed from Profile page */}
      <header className={profileStyles.header}>
        <div className={profileStyles.logoSection}>
          <div className={profileStyles.logo}></div>
          <div>
            <span className={profileStyles.brandName}>ClinicMate</span>
            <span className={profileStyles.tagline}>Your health dashboard</span>
          </div>
        </div>

        <nav className={profileStyles.nav}>
          <button className={profileStyles.navLink} onClick={() => handleNavClick('Home')}>
            Home
          </button>
          <button className={`${profileStyles.navLink} ${profileStyles.active}`} onClick={() => handleNavClick('Explore')}>
            Explore
          </button>
          <button className={profileStyles.navLink} onClick={() => handleNavClick('Appointments')}>
            Appointments
          </button>
          <button className={profileStyles.navLink} onClick={() => handleNavClick('Profile')}>
            Profile
          </button>
          <button className={profileStyles.navLink} onClick={() => handleNavClick('Help')}>
            Help
          </button>
        </nav>

        <div className={profileStyles.actions}>
          <button className={`${profileStyles.btn} ${profileStyles.btnPrimary}`}>New Appointment</button>
          <button className={`${profileStyles.btn} ${profileStyles.btnSecondary}`}>Sign Out</button>
        </div>
      </header>

      <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Explore</h1>
        <p className={styles.subtitle}>Find Hospitals & Doctors near you</p>
      </div>

      <div className={styles.searchBar}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search hospitals, doctors, specialties..."
          value={search.query}
          onChange={(e) => search.setQuery(e.target.value)}
        />
      </div>

      <div className={styles.viewToggle}>
        <button
          className={`${styles.toggleButton} ${
            search.view === 'hospitals' ? styles.active : ''
          }`}
          onClick={() => search.setView('hospitals')}
        >
          Hospitals
        </button>
        <button
          className={`${styles.toggleButton} ${
            search.view === 'doctors' ? styles.active : ''
          }`}
          onClick={() => search.setView('doctors')}
        >
          Doctors
        </button>
      </div>

      <div className={styles.filters}>
        {search.specialties.map((specialty) => (
          <button
            key={specialty.specialty_id}
            className={`${styles.filterChip} ${
              search.filters.specialtyId === specialty.specialty_id
                ? styles.active
                : ''
            }`}
            onClick={() => handleSpecialtyChange(specialty.specialty_id)}
          >
            {specialty.specialty_name}
          </button>
        ))}
        <button
          className={`${styles.filterChip} ${
            search.filters.openNow ? styles.active : ''
          }`}
          onClick={() =>
            search.setFilters((prev) => ({ ...prev, openNow: !prev.openNow }))
          }
        >
          Open now
        </button>
        <button
          className={`${styles.filterChip} ${
            search.filters.acceptsInsurance ? styles.active : ''
          }`}
          onClick={() =>
            search.setFilters((prev) => ({
              ...prev,
              acceptsInsurance: !prev.acceptsInsurance,
            }))
          }
        >
          Insurance accepted
        </button>
      </div>

      <div className={styles.content}>
        {search.results.error ? (
          <div className={styles.error}>{search.results.error}</div>
        ) : search.results.loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <div className={styles.listView}>
            {search.view === 'hospitals'
              ? search.results.items.map(renderHospitalCard)
              : search.results.items.map(renderDoctorCard)}
            {search.results.items.length === 0 && (
              <div className={styles.noResults}>
                No {search.view} found matching your criteria
              </div>
            )}
          </div>
        )}
        <div className={styles.mapPreview}>
          <h3>Map Preview</h3>
          <p>Coming soon...</p>
        </div>
      </div>
      </div>

      {/* Global Footer borrowed from Profile page */}
      <footer className={profileStyles.footer}>
        <p>© {new Date().getFullYear()} ClinicMate</p>
      </footer>
    </>
  );
};

export default ExplorePage;
