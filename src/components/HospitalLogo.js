import React, { useState } from 'react';
import hospitalLogo from '../assets/images/hospital-logo.png';
import './HospitalLogo.css';

const HospitalLogo = ({ size = 'medium', className = '', shape = 'circle' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    small: 'logo-small',
    medium: 'logo-medium',
    large: 'logo-large',
    xlarge: 'logo-xlarge'
  };

  const shapeClass = shape === 'square' ? 'logo-square' : '';

  // Fallback SVG if logo image is not available
  const FallbackLogo = () => (
    <svg className="hospital-logo-fallback" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#1e3a5f"/>
      <path d="M30 40L50 25L70 40V60L50 75L30 60V40Z" fill="white" opacity="0.9"/>
      <rect x="40" y="45" width="20" height="3" fill="#1e3a5f"/>
      <rect x="40" y="52" width="20" height="3" fill="#1e3a5f"/>
      <rect x="40" y="59" width="15" height="3" fill="#1e3a5f"/>
    </svg>
  );

  return (
    <div className={`hospital-logo-wrapper ${sizeClasses[size]} ${shapeClass} ${className}`}>
      {!imageError ? (
        <img 
          src={hospitalLogo} 
          alt="Kigali Specialized Orthopaedic Hospital Logo" 
          className="hospital-logo-img"
          onError={() => setImageError(true)}
        />
      ) : (
        <FallbackLogo />
      )}
    </div>
  );
};

export default HospitalLogo;

