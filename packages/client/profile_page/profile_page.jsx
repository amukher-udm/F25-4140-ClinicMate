import React, { useEffect, useState } from 'react';
import styles from './profile_page.module.css';

// Lightweight Profile page that fetches user data from the server API
export default function ProfilePage({ userId: propUserId, setCurrentPage }) {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Determine user id: prop, query param ?userId= or fallback to '1'
  const getUserId = () => {
    if (propUserId) return propUserId;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('userId') || '1';
    } catch (e) {
      return '1';
    }
  };

  const userId = getUserId();

  const handleNavClick = (page) => {
    if (setCurrentPage) {
      setCurrentPage(page.toLowerCase());
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/users/${encodeURIComponent(userId)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setFormData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError(err.message || 'Error fetching user');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const updateField = (key, value) => {
    setFormData((f) => ({ ...(f || {}), [key]: value }));
  };

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setFormData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <header className={styles.header}>
        <div className={styles.logoSection}>
          <div className={styles.logo}></div>
          <div>
            <span className={styles.brandName}>ClinicMate</span>
            <span className={styles.tagline}>Your health dashboard</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <button className={styles.navLink} onClick={() => handleNavClick('Home')}>
            Home
          </button>
          <button className={styles.navLink} onClick={() => handleNavClick('Explore')}>
            Explore
          </button>
          <button className={styles.navLink} onClick={() => handleNavClick('Appointments')}>
            Appointments
          </button>
          <button className={styles.navLink} onClick={() => handleNavClick('Profile')}>
            Profile
          </button>
          <button className={styles.navLink} onClick={() => handleNavClick('Help')}>
            Help
          </button>
        </nav>

        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`}>New Appointment</button>
          <button className={`${styles.btn} ${styles.btnSecondary}`}>Sign Out</button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.welcomeHeader}>
          <h1>Welcome, {formData ? (formData.preferredName || formData.firstName || 'Guest') : 'Guest'}</h1>
          <span className={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <div className={styles.searchContainer}>
            <input type="search" placeholder="Search" className={styles.searchInput} />
          </div>
        </div>

        <div className={styles.profileSection}>
          <div className={styles.profileHeader}>
            <div className={styles.profileInfo}>
              <div className={styles.avatar} aria-hidden></div>
              <div>
                <h2>{formData ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim() : 'Loading...'}</h2>
                <p>{formData ? formData.email : ''}</p>
              </div>
            </div>
            <button className={styles.editButton} onClick={handleSave} disabled={saving || loading}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>

          {loading ? (
            <p>Loading profile…</p>
          ) : error ? (
            <div style={{ color: 'crimson' }}>Error: {error}</div>
          ) : (
            <>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>First Name</label>
                  <input type="text" value={formData.firstName || ''} onChange={(e) => updateField('firstName', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Preferred Name</label>
                  <input type="text" value={formData.preferredName || ''} onChange={(e) => updateField('preferredName', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Last Name</label>
                  <input type="text" value={formData.lastName || ''} onChange={(e) => updateField('lastName', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Country</label>
                  <input type="text" value={formData.country || ''} onChange={(e) => updateField('country', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Middle Initial</label>
                  <input type="text" value={formData.middleInitial || ''} onChange={(e) => updateField('middleInitial', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Time Zone</label>
                  <input type="text" value={formData.timeZone || ''} onChange={(e) => updateField('timeZone', e.target.value)} />
                </div>
              </div>

              <div className={styles.contactInfo}>
                <div className={styles.contactSection}>
                  <h3>My email Address</h3>
                  <div className={styles.contactItem}>
                    <span>{formData.email}</span>
                    <span className={styles.timeAgo}>{formData.emailUpdatedAt ? new Date(formData.emailUpdatedAt).toLocaleDateString() : ''}</span>
                  </div>
                  <button className={styles.addButton} onClick={() => updateField('email', '')}>+Add / Edit Email</button>
                </div>

                <div className={styles.contactSection}>
                  <h3>My Phone Number</h3>
                  <div className={styles.contactItem}>
                    <span>{formData.phone}</span>
                    <span className={styles.timeAgo}>{formData.phoneUpdatedAt ? new Date(formData.phoneUpdatedAt).toLocaleDateString() : ''}</span>
                  </div>
                  <button className={styles.addButton} onClick={() => updateField('phone', '')}>+Add / Edit Phone</button>
                </div>

                <div className={styles.contactSection}>
                  <h3>My Address</h3>
                  <div className={styles.contactItem}>
                    <span>{formData.address}</span>
                    <span className={styles.timeAgo}>{formData.addressUpdatedAt ? new Date(formData.addressUpdatedAt).toLocaleDateString() : ''}</span>
                  </div>
                  <button className={styles.addButton} onClick={() => updateField('address', '')}>+Add / Edit Address</button>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <p>© {new Date().getFullYear()} ClinicMate</p>
        </footer>
      </main>
    </div>
  );
}