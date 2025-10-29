import React, { useState } from 'react';
import styles from './profile_page.module.css';

export default function ClinicMateDashboard() {
  const [currentPage, setCurrentPage] = useState('Profile');
  const [formData, setFormData] = useState({});

  const handleNavClick = (page) => {
    setCurrentPage(page);
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
          <a href="#" className={`${styles.navLink} ${currentPage === 'Home' ? styles.active : ''}`} onClick={() => handleNavClick('Home')}>
            Home
          </a>
          <a href="#" className={`${styles.navLink} ${currentPage === 'Explore' ? styles.active : ''}`} onClick={() => handleNavClick('Explore')}>
            Explore
          </a>
          <a href="#" className={`${styles.navLink} ${currentPage === 'Appointments' ? styles.active : ''}`} onClick={() => handleNavClick('Appointments')}>
            Appointments
          </a>
          <a href="#" className={`${styles.navLink} ${currentPage === 'Profile' ? styles.active : ''}`} onClick={() => handleNavClick('Profile')}>
            Profile
          </a>
          <a href="#" className={`${styles.navLink} ${currentPage === 'Help' ? styles.active : ''}`} onClick={() => handleNavClick('Help')}>
            Help
          </a>
        </nav>

        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`}>New Appointment</button>
          <button className={`${styles.btn} ${styles.btnSecondary}`}>Sign Out</button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.welcomeHeader}>
          <h1>Welcome, John</h1>
          <span className={styles.date}>Sunday, 28 September 2025</span>
          <div className={styles.searchContainer}>
            <input type="search" placeholder="Search" className={styles.searchInput} />
          </div>
        </div>

        <div className={styles.profileSection}>
          <div className={styles.profileHeader}>
            <div className={styles.profileInfo}>
              <div className={styles.avatar}></div>
              <div>
                <h2>John Doe</h2>
                <p>johndoe@email.com</p>
              </div>
            </div>
            <button className={styles.editButton}>Edit</button>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>First Name</label>
              <input type="text" placeholder="First Name" />
            </div>
            <div className={styles.formGroup}>
              <label>Preferred Name</label>
              <input type="text" placeholder="Preferred Name" />
            </div>
            <div className={styles.formGroup}>
              <label>Last Name</label>
              <input type="text" placeholder="Last Name" />
            </div>
            <div className={styles.formGroup}>
              <label>Country</label>
              <select>
                <option>Country</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Middle Initial</label>
              <input type="text" placeholder="Initial" />
            </div>
            <div className={styles.formGroup}>
              <label>Time Zone</label>
              <select>
                <option>Timezone</option>
              </select>
            </div>
          </div>

          <div className={styles.contactInfo}>
            <div className={styles.contactSection}>
              <h3>My email Address</h3>
              <div className={styles.contactItem}>
                <span>johndoe@email.com</span>
                <span className={styles.timeAgo}>1 month ago</span>
              </div>
              <button className={styles.addButton}>+Add Email Address</button>
            </div>

            <div className={styles.contactSection}>
              <h3>My Phone Number</h3>
              <div className={styles.contactItem}>
                <span>(123) 456-7890</span>
                <span className={styles.timeAgo}>1 month ago</span>
              </div>
              <button className={styles.addButton}>+Add Phone Number</button>
            </div>

            <div className={styles.contactSection}>
              <h3>My Address</h3>
              <div className={styles.contactItem}>
                <span>123 MainStreet, City, State, Zipcode</span>
                <span className={styles.timeAgo}>1 month ago</span>
              </div>
              <button className={styles.addButton}>+Add Address</button>
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <p>© 2025 ClinicMate</p>
        </footer>
      </main>
    </div>
  );
}