import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import styles from './ProfilePage.module.css';
import { useAuth } from '../../state/AuthContext.jsx';

function Modal({ title, children, onClose }) {
  return (
    <div style={backdropStyle} role="dialog" aria-modal="true">
      <div style={modalStyle}>
        <div style={modalHeaderRow}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const backdropStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
};
const modalStyle = {
  width: 'min(520px, 92vw)', background: '#fff', borderRadius: 12,
  border: '1px solid var(--slate-200)', boxShadow: '0 12px 30px rgba(0,0,0,0.2)', padding: 16
};
const modalHeaderRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 };
const fieldStyle = { height: 44, borderRadius: 10, border: '1px solid var(--slate-300)', padding: '0 12px' };
const actionRow = { display: 'flex', gap: 8, justifyContent: 'flex-end' };

export default function ProfilePage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  
  // Address fields
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  
  // Modals
  const [emailOpen, setEmailOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  
  // Modal drafts
  const [emailDraft, setEmailDraft] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');
  const [streetDraft, setStreetDraft] = useState('');
  const [cityDraft, setCityDraft] = useState('');
  const [stateDraft, setStateDraft] = useState('');
  const [zipDraft, setZipDraft] = useState('');

  // Load profile data
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const token = getToken();
        const res = await fetch('/api/profile_data', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          const patient = data.patients;
          
          setFirstName(patient.first_name || '');
          setLastName(patient.last_name || '');
          setPhone(patient.phone_number || '');
          
          // Address data
          if (patient.address) {
            setStreet(patient.address.street || '');
            setCity(patient.address.city || '');
            setState(patient.address.state || '');
            setZipCode(patient.address.zip_code || '');
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading profile:', err);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, navigate, getToken]);

  const displayName = `${firstName} ${lastName}`.trim() || 'Your Name';
  const todayStr = new Date().toLocaleDateString(undefined, { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  const addressLine = [street, city, state, zipCode].filter(Boolean).join(', ') || 'No address on file';

  // Save main profile
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch('/api/update_profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phone.trim(),
        })
      });

      if (res.ok) {
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  // Modal openers
  const openEmail = () => { setEmailDraft(user?.email || ''); setEmailOpen(true); };
  const openPhone = () => { setPhoneDraft(phone || ''); setPhoneOpen(true); };
  const openAddress = () => {
    setStreetDraft(street || '');
    setCityDraft(city || '');
    setStateDraft(state || '');
    setZipDraft(zipCode || '');
    setAddressOpen(true);
  };

  // Modal saves
  const saveEmail = () => {
    // Email changes require Supabase Auth update - implement if needed
    alert('Email changes require additional verification - feature coming soon');
    setEmailOpen(false);
  };

  const savePhone = async () => {
    const cleaned = (phoneDraft || '').replace(/\D/g, '').slice(0, 10);
    
    try {
      const token = getToken();
      const res = await fetch('/api/update_profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone_number: cleaned,
        })
      });

      if (res.ok) {
        setPhone(cleaned);
        setPhoneOpen(false);
      } else {
        alert('Failed to update phone');
      }
    } catch (err) {
      console.error('Error saving phone:', err);
      alert('Error saving phone');
    }
  };

  const saveAddress = async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/update_address', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          street: streetDraft.trim(),
          city: cityDraft.trim(),
          state: stateDraft.trim(),
          zip_code: (zipDraft || '').replace(/\D/g, '').slice(0, 5),
        })
      });

      if (res.ok) {
        setStreet(streetDraft.trim());
        setCity(cityDraft.trim());
        setState(stateDraft.trim());
        setZipCode((zipDraft || '').replace(/\D/g, '').slice(0, 5));
        setAddressOpen(false);
      } else {
        alert('Failed to update address');
      }
    } catch (err) {
      console.error('Error saving address:', err);
      alert('Error saving address');
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <main className="container">
          <div className={styles.welcomeHeader}>
            <h1>Loading...</h1>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />

      <main className="container">
        <div className={styles.welcomeHeader}>
          <h1>{`Welcome, ${displayName}`}</h1>
          <span className={styles.date}>{todayStr}</span>
        </div>

        <section className={styles.profileSection}>
          <div className={styles.profileHeader}>
            <div className={styles.profileInfo}>
              <div className={styles.avatar} />
              <div>
                <h2>{displayName}</h2>
                <p className="muted">{user.email}</p>
              </div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {/* Form grid */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>First Name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={30}
                placeholder="First Name"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Middle Initial</label>
              <input
                value={middleInitial}
                onChange={(e) => setMiddleInitial(e.target.value.slice(0, 1))}
                maxLength={1}
                placeholder="Initial"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Last Name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={30}
                placeholder="Last Name"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select gender</option>
                <option>Female</option>
                <option>Male</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
                <option>Other</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Country</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">Country</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Time Zone</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="">Timezone</option>
                <option>America/Detroit</option>
                <option>America/New_York</option>
                <option>America/Chicago</option>
                <option>America/Los_Angeles</option>
              </select>
            </div>
          </div>

          {/* Contact sections */}
          <div className={styles.contactInfo}>
            {/* Email */}
            <div className={styles.contactSection}>
              <h3>My email Address</h3>
              <div
                className={styles.contactItem}
                role="button"
                tabIndex={0}
                onClick={openEmail}
                onKeyDown={(e) => e.key === 'Enter' && openEmail()}
                style={{ cursor: 'pointer' }}
              >
                <span>{user.email || '—'}</span>
                <span className={styles.timeAgo}>Not verified</span>
              </div>
              <button className="btn btn-primary-outline btn-pill" onClick={openEmail}>
                Edit Email
              </button>
            </div>

            {/* Phone */}
            <div className={styles.contactSection}>
              <h3>My Phone Number</h3>
              <div
                className={styles.contactItem}
                role="button"
                tabIndex={0}
                onClick={openPhone}
                onKeyDown={(e) => e.key === 'Enter' && openPhone()}
                style={{ cursor: 'pointer' }}
              >
                <span>{phone || '(not provided)'}</span>
                <span className={styles.timeAgo}>{phone ? 'Set' : 'Never'}</span>
              </div>
              <button className="btn btn-primary-outline btn-pill" onClick={openPhone}>
                {phone ? 'Edit Phone' : '+Add Phone Number'}
              </button>
            </div>

            {/* Address */}
            <div className={styles.contactSection}>
              <h3>My Address</h3>
              <div
                className={styles.contactItem}
                role="button"
                tabIndex={0}
                onClick={openAddress}
                onKeyDown={(e) => e.key === 'Enter' && openAddress()}
                style={{ cursor: 'pointer' }}
              >
                <span>{addressLine}</span>
                <span className={styles.timeAgo}>{street ? 'Set' : 'Never'}</span>
              </div>
              <button className="btn btn-primary-outline btn-pill" onClick={openAddress}>
                {street ? 'Edit Address' : '+Add Address'}
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Modals */}
      {emailOpen && (
        <Modal title="Update Email" onClose={() => setEmailOpen(false)}>
          <div style={{ display: 'grid', gap: 12 }}>
            <input
              type="email"
              placeholder="Email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              style={fieldStyle}
            />
            <div style={actionRow}>
              <button className="btn btn-secondary" onClick={() => setEmailOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEmail}>Save Email</button>
            </div>
          </div>
        </Modal>
      )}

      {phoneOpen && (
        <Modal title="Update Phone Number" onClose={() => setPhoneOpen(false)}>
          <div style={{ display: 'grid', gap: 12 }}>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="3133133133"
              value={phoneDraft}
              onChange={(e) => setPhoneDraft(e.target.value.replace(/\D/g, '').slice(0, 10))}
              style={fieldStyle}
            />
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Enter 10 digits (e.g., 3133133133)</div>
            <div style={actionRow}>
              <button className="btn btn-secondary" onClick={() => setPhoneOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={savePhone}>Save Phone</button>
            </div>
          </div>
        </Modal>
      )}

      {addressOpen && (
        <Modal title="Update Address" onClose={() => setAddressOpen(false)}>
          <div style={{ display: 'grid', gap: 12 }}>
            <input
              type="text"
              placeholder="Street"
              value={streetDraft}
              onChange={(e) => setStreetDraft(e.target.value)}
              style={fieldStyle}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input
                type="text"
                placeholder="City"
                value={cityDraft}
                onChange={(e) => setCityDraft(e.target.value)}
                style={fieldStyle}
              />
              <input
                type="text"
                placeholder="State"
                value={stateDraft}
                onChange={(e) => setStateDraft(e.target.value)}
                style={fieldStyle}
                maxLength={2}
              />
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="ZIP"
              value={zipDraft}
              onChange={(e) => setZipDraft(e.target.value.replace(/\D/g, '').slice(0, 5))}
              style={fieldStyle}
            />
            <div style={actionRow}>
              <button className="btn btn-secondary" onClick={() => setAddressOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAddress}>Save Address</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}