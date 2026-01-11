import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../services/authService';
import HospitalLogo from '../components/HospitalLogo';
import './HomePage.css';

const HomePage = () => {
  const authenticated = isAuthenticated();
  const currentUser = authenticated ? getCurrentUser() : null;
  const isDoctor = currentUser?.role?.toLowerCase() === 'doctor';
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const sectionRefs = useRef({});

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      // Show scroll to top button after scrolling down
      setShowScrollTop(window.scrollY > 300);

      // Check which sections are visible
      const newVisibleSections = new Set();
      Object.keys(sectionRefs.current).forEach(key => {
        const element = sectionRefs.current[key];
        if (element) {
          const rect = element.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight * 0.8 && rect.bottom > 0;
          if (isVisible) {
            newVisibleSections.add(key);
          }
        }
      });
      setVisibleSections(newVisibleSections);
    };

    // Use Intersection Observer for better performance
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionKey = Object.keys(sectionRefs.current).find(
            key => sectionRefs.current[key] === entry.target
          );
          if (sectionKey) {
            setVisibleSections(prev => new Set([...prev, sectionKey]));
          }
        }
      });
    }, observerOptions);

    // Observe all sections
    Object.values(sectionRefs.current).forEach(element => {
      if (element) {
        observer.observe(element);
      }
    });

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on mount

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  // Set ref callback
  const setSectionRef = (key) => (el) => {
    if (el) {
      sectionRefs.current[key] = el;
    }
  };

  // Initialize hero section as visible on mount
  useEffect(() => {
    setVisibleSections(prev => new Set([...prev, 'hero']));
  }, []);

  const services = [
    {
      icon: '🦴',
      title: 'Trauma Orthopaedics',
      description: 'Expert care for fractures, dislocations, and traumatic injuries'
    },
    {
      icon: '🏃',
      title: 'Sports Orthopaedics',
      description: 'Specialized treatment for sports-related injuries and rehabilitation'
    },
    {
      icon: '🦽',
      title: 'Arthroplasty',
      description: 'Joint replacement surgery including hip, knee, and shoulder'
    },
    {
      icon: '👶',
      title: 'Pediatric Orthopaedics',
      description: 'Comprehensive orthopaedic care for children and adolescents'
    },
    {
      icon: '🦶',
      title: 'Foot and Ankle',
      description: 'Specialized care for foot and ankle conditions and injuries'
    },
    {
      icon: '🔬',
      title: 'Tumor and Sepsis',
      description: 'Advanced treatment for bone tumors and orthopaedic infections'
    }
  ];

  return (
    <div className="home-page">
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button 
          className="scroll-to-top" 
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <span className="scroll-arrow">↑</span>
        </button>
      )}

      {/* Hero Section */}
      <section className="hero-section" ref={setSectionRef('hero')}>
        <div className="hero-background-animation"></div>
        <div className="hero-content">
          <div className={`hero-logo ${visibleSections.has('hero') ? 'animate-fade-in-up' : ''}`}>
            <HospitalLogo size="xlarge" shape="circle" />
          </div>
          <h1 className={`hero-title ${visibleSections.has('hero') ? 'animate-fade-in-up delay-1' : ''}`}>
            Welcome to Kigali Specialized Orthopaedic Hospital
          </h1>
          <p className={`hero-subtitle ${visibleSections.has('hero') ? 'animate-fade-in-up delay-2' : ''}`}>
            Excellence in Orthopaedic Care for Rwanda and Beyond
          </p>
          <p className={`hero-description ${visibleSections.has('hero') ? 'animate-fade-in-up delay-3' : ''}`}>
            We are dedicated to providing world-class orthopaedic treatment, 
            combining advanced medical technology with compassionate care to help 
            our patients regain mobility and improve their quality of life.
          </p>
          <div className={`hero-actions ${visibleSections.has('hero') ? 'animate-fade-in-up delay-4' : ''}`}>
            {authenticated ? (
              <>
                {isDoctor ? (
                  <Link to="/doctor-dashboard" className="btn btn-primary btn-hero">
                    <span>Go to Dashboard</span>
                    <span className="btn-arrow">→</span>
                  </Link>
                ) : (
                  <Link to="/dashboard" className="btn btn-primary btn-hero">
                    <span>Go to Dashboard</span>
                    <span className="btn-arrow">→</span>
                  </Link>
                )}
                {isDoctor && (
                  <Link to="/doctors-chat" className="btn btn-secondary btn-hero">
                    <span>Doctors Chat</span>
                    <span className="btn-arrow">→</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/scheduled-appointments" className="btn btn-primary btn-hero">
                  <span>Appointment Portal</span>
                  <span className="btn-arrow">→</span>
                </Link>
                <Link to="/contact" className="btn btn-secondary btn-hero">
                  <span>Contact Us</span>
                  <span className="btn-arrow">→</span>
                </Link>
                <Link to="/doctors-chat" className="btn btn-secondary btn-hero">
                  <span>Doctors Chat</span>
                  <span className="btn-arrow">→</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section 
        className={`about-section ${visibleSections.has('about') ? 'section-visible' : ''}`}
        ref={setSectionRef('about')}
      >
        <div className="container">
          <div className={`section-header ${visibleSections.has('about') ? 'animate-fade-in-up' : ''}`}>
            <h2 className="section-title">About Our Hospital</h2>
            <p className="section-description">
              Kigali Specialized Orthopaedic Hospital is a leading healthcare facility 
              dedicated to providing comprehensive orthopaedic care to patients across Rwanda.
            </p>
          </div>
          <div className="about-grid">
            <div className={`about-card ${visibleSections.has('about') ? 'animate-slide-up delay-1' : ''}`}>
              <div className="about-icon-wrapper">
                <div className="about-icon">🏥</div>
                <div className="icon-ripple"></div>
              </div>
              <h3 className="about-card-title">State-of-the-Art Facilities</h3>
              <p className="about-card-text">
                Our hospital is equipped with the latest medical technology and 
                modern facilities to ensure the best possible care for our patients.
              </p>
            </div>
            <div className={`about-card ${visibleSections.has('about') ? 'animate-slide-up delay-2' : ''}`}>
              <div className="about-icon-wrapper">
                <div className="about-icon">👨‍⚕️</div>
                <div className="icon-ripple"></div>
              </div>
              <h3 className="about-card-title">Expert Medical Team</h3>
              <p className="about-card-text">
                Our team of highly qualified orthopaedic surgeons and specialists 
                bring years of experience and expertise to every patient interaction.
              </p>
            </div>
            <div className={`about-card ${visibleSections.has('about') ? 'animate-slide-up delay-3' : ''}`}>
              <div className="about-icon-wrapper">
                <div className="about-icon">💚</div>
                <div className="icon-ripple"></div>
              </div>
              <h3 className="about-card-title">Patient-Centered Care</h3>
              <p className="about-card-text">
                We prioritize our patients' well-being and comfort, providing 
                personalized care tailored to each individual's unique needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section 
        className={`services-section ${visibleSections.has('services') ? 'section-visible' : ''}`}
        ref={setSectionRef('services')}
      >
        <div className="container">
          <div className={`section-header ${visibleSections.has('services') ? 'animate-fade-in-up' : ''}`}>
            <h2 className="section-title">Our Services</h2>
            <p className="section-description">
              We offer a comprehensive range of orthopaedic services to address 
              various conditions and injuries.
            </p>
          </div>
          <div className="services-grid">
            {services.map((service, index) => (
              <div 
                key={index} 
                className={`service-card ${visibleSections.has('services') ? 'animate-scale-in' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="service-icon-wrapper">
                  <div className="service-icon">{service.icon}</div>
                  <div className="service-icon-bg"></div>
                </div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <div className="service-hover-effect"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section 
        className={`contact-info-section ${visibleSections.has('contact') ? 'section-visible' : ''}`}
        ref={setSectionRef('contact')}
      >
        <div className="container">
          <div className={`section-header ${visibleSections.has('contact') ? 'animate-fade-in-up' : ''}`}>
            <h2 className="section-title">Get In Touch</h2>
            <p className="section-description">
              We're here to help. Reach out to us for appointments, inquiries, or emergencies.
            </p>
          </div>
          <div className="contact-info-grid">
            <div className={`contact-info-card ${visibleSections.has('contact') ? 'animate-slide-up delay-1' : ''}`}>
              <div className="contact-info-icon-wrapper">
                <div className="contact-info-icon">📞</div>
                <div className="icon-pulse"></div>
              </div>
              <h3 className="contact-info-title">Phone</h3>
              <p className="contact-info-value">+250 796 599 444</p>
              <p className="contact-info-label">Available 24/7 for emergencies</p>
            </div>
            <div className={`contact-info-card ${visibleSections.has('contact') ? 'animate-slide-up delay-2' : ''}`}>
              <div className="contact-info-icon-wrapper">
                <div className="contact-info-icon">✉️</div>
                <div className="icon-pulse"></div>
              </div>
              <h3 className="contact-info-title">Email</h3>
              <p className="contact-info-value">info.ksoh@gmail.com</p>
              <p className="contact-info-label">We respond within 24 hours</p>
            </div>
            <div className={`contact-info-card ${visibleSections.has('contact') ? 'animate-slide-up delay-3' : ''}`}>
              <div className="contact-info-icon-wrapper">
                <div className="contact-info-icon">📍</div>
                <div className="icon-pulse"></div>
              </div>
              <h3 className="contact-info-title">Location</h3>
              <p className="contact-info-value">KG 611 Gishushu</p>
              <p className="contact-info-label">Kigali, Rwanda</p>
            </div>
          </div>
          <div className={`contact-cta ${visibleSections.has('contact') ? 'animate-fade-in-up delay-4' : ''}`}>
            <Link to="/contact" className="btn btn-primary btn-large">
              <span>Send Us a Message</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className={`cta-section ${visibleSections.has('cta') ? 'section-visible' : ''}`}
        ref={setSectionRef('cta')}
      >
        <div className="cta-background-animation"></div>
        <div className="container">
          <div className={`cta-content ${visibleSections.has('cta') ? 'animate-fade-in-up' : ''}`}>
            <h2 className="cta-title">Ready to Schedule an Appointment?</h2>
            <p className="cta-description">
              Book your consultation with our expert orthopaedic specialists today.
            </p>
            {authenticated ? (
              <Link to="/appointments" className="btn btn-primary btn-large">
                <span>Book Appointment</span>
                <span className="btn-arrow">→</span>
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary btn-large">
                <span>Login to Book Appointment</span>
                <span className="btn-arrow">→</span>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

