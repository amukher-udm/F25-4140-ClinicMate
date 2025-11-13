import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './LegalPages.css';

export default function Terms() {
  return (
    <>
      <Navbar />
      <main className="legal-page container">
        <h1>Terms & Conditions</h1>
        <p>
          Welcome to ClinicMate. By using our platform, you agree to the following terms and conditions.
          Please read them carefully before booking appointments or using our services.
        </p>
        <h2>Description of Services</h2>
        <p>
          ClinicMate is a web-based healthcare appointment management system designed to help patients register, 
          browse hospitals and doctors, and book appointments online. The platform serves as a scheduling and management 
          tool and does not provide medical advice or treatment. All medical services are provided by independent healthcare 
          providers, not by ClinicMate.
        </p>
        <h2>User Responsibilities</h2>
        <p>
          When using ClinicMate, you agree to provide accurate and complete information during registration and to use the platform 
          only for lawful purposes. You may not impersonate another person, share your login credentials, or attempt to hack or disrupt 
          the platform in any way. You are responsible for maintaining the confidentiality of your account information and for all 
          activities that occur under your account.
        </p>
        <h2>Intellectual Property</h2>
        <p>
          All content, design elements, and logos displayed on ClinicMate are the property of ClinicMate or its licensors. You may not 
          reproduce, modify, or distribute any material from the website without prior written permission.
        </p>
        <h2>Changes to Terms</h2>
        <p>
          ClinicMate may modify or update these Terms of Service at any time. Continued use of the platform after such changes constitutes 
          acceptance of the new terms.ClinicMate may modify or update these Terms of Service at any time. Continued use of the platform after 
          such changes constitutes acceptance of the new terms.
        </p>
        <div className="help-legal-footer">
          <a href="/privacy-policy">Privacy Policy</a> | 
          <a href="/terms">Terms</a>
        </div>
      </main>
      <Footer />
    </>
  );
}