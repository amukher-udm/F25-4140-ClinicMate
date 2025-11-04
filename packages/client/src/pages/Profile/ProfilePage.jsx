// src/pages/Profile/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx'; // shared navbar
import styles from './ProfilePage.module.css';
import Footer from '../../components/Footer.jsx';
import supabase from '../../lib/supabaseClient';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        // Get current authenticated user
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!currentUser) {
          // Not signed in
          if (mounted) setError('Not signed in');
          return;
        }

        if (mounted) setUser(currentUser);

        // Fetch additional profile information from 'profiles' table.
        // Assumption: a `profiles` table exists with `id` = auth.user.id
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 = No rows returned for .single() in some environments; treat as no profile
          throw profileError;
        }

        if (mounted) setProfile(profileData || null);
      } catch (err) {
        console.error('Profile load error', err);
        if (mounted) setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Your name';
  const displayEmail = user?.email || profile?.email || '—';

  return (
    <>
      <Navbar />

      <main className="container">
        <div className={styles.welcomeHeader}>
          <h1>{loading ? 'Loading...' : `Welcome, ${displayName}`}</h1>
          <span className={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <div className={styles.searchContainer}>
            <input type="search" placeholder="Search" className={styles.searchInput} />
          </div>
        </div>

        <section className={styles.profileSection}>
          <div className={styles.profileHeader}>
            <div className={styles.profileInfo}>
              <div className={styles.avatar} />
              <div>
                <h2>{displayName}</h2>
                <p className="muted">{displayEmail}</p>
              </div>
            </div>

            <button className="btn btn-primary">Edit</button>
          </div>

          {error && (
            <div role="alert" style={{ color: 'var(--color-danger)', marginTop: 12 }}>
              {error}
            </div>
          )}

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>First Name</label>
              <input type="text" placeholder="First Name" defaultValue={profile?.first_name || ''} />
            </div>
            <div className={styles.formGroup}>
              <label>Preferred Name</label>
              <input type="text" placeholder="Preferred Name" defaultValue={profile?.preferred_name || ''} />
            </div>
            <div className={styles.formGroup}>
              <label>Last Name</label>
              <input type="text" placeholder="Last Name" defaultValue={profile?.last_name || ''} />
            </div>
            <div className={styles.formGroup}>
              <label>Country</label>
              <select defaultValue={profile?.country || ''}><option value="">Country</option></select>
            </div>
            <div className={styles.formGroup}>
              <label>Middle Initial</label>
              <input type="text" placeholder="Initial" defaultValue={profile?.middle_initial || ''} />
            </div>
            <div className={styles.formGroup}>
              <label>Time Zone</label>
              <select defaultValue={profile?.timezone || ''}><option value="">Timezone</option></select>
            </div>
          </div>

          <div className={styles.contactInfo}>
            <div className={styles.contactSection}>
              <h3>My email Address</h3>
              <div className={styles.contactItem}>
                <span>{displayEmail}</span>
                <span className={styles.timeAgo}>{profile?.email_verified_at ? 'Verified' : 'Not verified'}</span>
              </div>
              <button className="btn btn-primary-outline btn-pill">+Add Email Address</button>
            </div>

            <div className={styles.contactSection}>
              <h3>My Phone Number</h3>
              <div className={styles.contactItem}>
                <span>{profile?.phone || '(not provided)'}</span>
                <span className={styles.timeAgo}>{profile?.phone_updated_at ? 'Updated' : 'Never'}</span>
              </div>
              <button className="btn btn-primary-outline btn-pill">+Add Phone Number</button>
            </div>

            <div className={styles.contactSection}>
              <h3>My Address</h3>
              <div className={styles.contactItem}>
                <span>{profile?.address || 'No address on file'}</span>
                <span className={styles.timeAgo}>{profile?.address_updated_at ? 'Updated' : 'Never'}</span>
              </div>
              <button className="btn btn-primary-outline btn-pill">+Add Address</button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
