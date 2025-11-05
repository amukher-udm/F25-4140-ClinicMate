// src/pages/Profile/ProfilePage.jsx
import React from 'react';
import Navbar from '../../components/Navbar.jsx';   // ← use shared navbar
import styles from './ProfilePage.module.css';
import Footer from '../../components/Footer.jsx';   

export default function ProfilePage() {
  return (
    <>
      <Navbar />  {/* identical header across pages */}

      <main className="container">  {/* use global container */}
        <div className={styles.welcomeHeader}>
          <h1>Welcome, John</h1>
          <span className={styles.date}>Sunday, 28 September 2025</span>
          <div className={styles.searchContainer}>
            <input type="search" placeholder="Search" className={styles.searchInput} />
          </div>
        </div>

        <section className={styles.profileSection}>
          <div className={styles.profileHeader}>
            <div className={styles.profileInfo}>
              <div className={styles.avatar} />
              <div>
                <h2>John Doe</h2>
                <p className="muted">johndoe@email.com</p> {/* global muted */}
              </div>
            </div>

            {/* use global button styles */}
            <button className="btn btn-primary">Edit</button>
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
              <select><option>Country</option></select>
            </div>
            <div className={styles.formGroup}>
              <label>Middle Initial</label>
              <input type="text" placeholder="Initial" />
            </div>
            <div className={styles.formGroup}>
              <label>Time Zone</label>
              <select><option>Timezone</option></select>
            </div>
          </div>

          <div className={styles.contactInfo}>
            <div className={styles.contactSection}>
              <h3>My email Address</h3>
              <div className={styles.contactItem}>
                <span>johndoe@email.com</span>
                <span className={styles.timeAgo}>1 month ago</span>
              </div>
              <button className="btn btn-primary-outline btn-pill">+Add Email Address</button>
            </div>

            <div className={styles.contactSection}>
              <h3>My Phone Number</h3>
              <div className={styles.contactItem}>
                <span>(123) 456-7890</span>
                <span className={styles.timeAgo}>1 month ago</span>
              </div>
              <button className="btn btn-primary-outline btn-pill">+Add Phone Number</button>
            </div>

            <div className={styles.contactSection}>
              <h3>My Address</h3>
              <div className={styles.contactItem}>
                <span>123 MainStreet, City, State, Zipcode</span>
                <span className={styles.timeAgo}>1 month ago</span>
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
