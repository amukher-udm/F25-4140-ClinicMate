import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './HelpPage.css';

const faqs = [
  { question: "How do I book an appointment?", answer: "You can book an appointment from the Explore page by selecting a doctor or hospital and following the booking steps." },
  { question: "How can I reset my password?", answer: "Go to the login page, click 'Forgot Password', and follow the instructions to reset your password." },
  { question: "Is my data secure?", answer: "Yes, all personal and health information is stored securely." },
  { question: "Can I cancel my appointment?", answer: "Yes, go to your Profile and select your appointment to cancel." },
];

export default function HelpPage() {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const toggleFAQ = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple frontend validation
    const allFilled = Object.values(formData).every(val => val.trim() !== "");
    if (allFilled) {
      setFormSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setFormSubmitted(false), 3000);
    } else {
      alert("Please fill in all fields.");
    }
  };

  return (
    <>
      <Navbar />
      <main className="help-page container">
        <h1>Help & Support</h1>

        <section className="faq-section">
          <h2>Frequently Asked Questions</h2>
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button className="faq-question" onClick={() => toggleFAQ(index)}>
                {faq.question}
              </button>
              {expandedIndex === index && <p className="faq-answer">{faq.answer}</p>}
            </div>
          ))}
        </section>

        <section className="contact-section">
          <h2>Contact Us</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            <input type="text" name="subject" placeholder="Subject" value={formData.subject} onChange={handleChange} required />
            <textarea name="message" placeholder="Message" value={formData.message} onChange={handleChange} required />
            <button type="submit" className="help-submit-btn">Submit</button>
          </form>
          {formSubmitted && <div className="success-popup">Message sent successfully!</div>}
        </section>
      <div className="help-legal-footer">
          <a href="/privacy-policy">Privacy Policy</a> | 
          <a href="/terms">Terms</a>
        </div>
      </main>
      <Footer />
    </>
  );
}