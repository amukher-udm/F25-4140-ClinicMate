import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './LegalPages.css';

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <main className="legal-page container">
        <h1>Privacy Policy</h1>
        <p>
          At ClinicMate, we respect your privacy and are committed to protecting your personal data.
          This policy explains how we collect, use, and safeguard your information when you use our services.
        </p>
        <h2>Information We Collect</h2>
        <p>
          When you register or use ClinicMate, we may collect personal information such as your name, 
          email address, phone number, and date of birth. We also collect information about your appointments, 
          including details about the hospitals and doctors you select and the times you choose. If you share 
          health-related information while booking or managing appointments, we may store that data to help provide 
          better service. In addition, we collect non-personal data, such as browser type, device information, and 
          pages visited, to improve the performance and user experience of our website
        </p>
        <h2>How We Use Your Information</h2>
        <p>
          We use the information we collect to provide, manage, and improve our healthcare appointment services. 
          This includes facilitating communication between patients and healthcare providers, sending appointment 
          confirmations, reminders, and important notifications, and ensuring the overall security and integrity of 
          our platform. We do not sell or rent your personal information to any third party.
        </p>
        <h2>Data Protection</h2>
        <p>
          ClinicMate uses administrative, technical, and physical safeguards to protect your data from unauthorized access, 
          alteration, or disclosure. While we take these precautions seriously, no online system is completely secure, and 
          we cannot guarantee absolute protection of your information.
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