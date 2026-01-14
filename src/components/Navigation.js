import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/authService';
import HospitalLogo from './HospitalLogo';
import SvgIcon from './SvgIcon';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Define all navigation items with access control
  const allNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['Admin', 'admin'] },
    { path: '/doctor-dashboard', label: 'Doctor Dashboard', icon: 'doctor', roles: ['doctor', 'Doctor'] },
    { path: '/pr-dashboard', label: 'PR Dashboard', icon: 'chat', roles: ['PR', 'pr'] },
    { path: '/user-dashboard', label: 'My Dashboard', icon: 'user', roles: ['User', 'user', 'patient', 'Patient'] },
    { path: '/users', label: 'Users', icon: 'users', roles: ['Admin', 'admin'] },
    { path: '/roles', label: 'Roles', icon: 'lock', roles: ['Admin', 'admin'] },
    { path: '/patients', label: 'Patients', icon: 'hospital', roles: ['Admin', 'admin', 'doctor', 'Doctor', 'PR', 'pr', 'receptionist', 'Receptionist'] },
    { path: '/doctors', label: 'Doctors', icon: 'doctor', roles: ['Admin', 'admin'] },
    { path: '/departments', label: 'Departments', icon: 'building', roles: ['Admin', 'admin'] },
    { path: '/insurances', label: 'Insurances', icon: 'shield', roles: ['Admin', 'admin'] },
    { path: '/doctor-schedules', label: 'Doctor Schedules', icon: 'calendar', roles: ['Admin', 'admin', 'doctor', 'Doctor', 'PR', 'pr'] },
    { path: '/appointments', label: 'Appointments', icon: 'clipboard', roles: ['Admin', 'admin', 'doctor', 'Doctor', 'PR', 'pr', 'receptionist', 'Receptionist'] },
    { path: '/appointment-status-history', label: 'Status History', icon: 'chart', roles: ['Admin', 'admin'] },
    { path: '/appointment-changes', label: 'Appointment Changes', icon: 'refresh', roles: ['Admin', 'admin'] },
    { path: '/medical-records', label: 'Medical Records', icon: 'file', roles: ['Admin', 'admin', 'doctor', 'Doctor'] },
    { path: '/notifications', label: 'Notifications', icon: 'bell', roles: ['Admin', 'admin', 'doctor', 'Doctor', 'PR', 'pr', 'User', 'user', 'patient', 'Patient'] },
    { path: '/reports', label: 'Reports', icon: 'chart', roles: ['Admin', 'admin', 'doctor', 'Doctor'] },
    { path: '/contact-doctor', label: 'Contact', icon: 'mail', roles: ['doctor', 'Doctor'], contactType: 'doctor' },
    { path: '/contact-admin', label: 'Contact', icon: 'mail', roles: ['Admin', 'admin'], contactType: 'admin' },
    { path: '/contact-patient', label: 'Contact', icon: 'mail', roles: ['patient', 'Patient', 'User', 'user'], contactType: 'patient' },
    { path: '/contacts', label: 'Contact Messages', icon: 'chat', roles: ['Admin', 'admin', 'PR', 'pr'] },
    { path: '/doctors-chat', label: 'Doctors Chat', icon: 'chat', roles: ['doctor', 'Doctor'] },
    { path: '/audit-logs', label: 'Audit Logs', icon: 'file', roles: ['Admin', 'admin'] }
  ];

  // Filter navigation items based on user role
  const getNavItems = () => {
    if (!currentUser || !currentUser.role) {
      // If no role, show admin items (default)
      return allNavItems.filter(item => !item.roles || item.roles.includes('Admin') || item.roles.includes('admin'));
    }
    
    const userRole = currentUser.role;
    return allNavItems.filter(item => {
      if (!item.roles) return true; // If no roles specified, show to all
      return item.roles.includes(userRole);
    });
  };

  const navItems = getNavItems();

  // Get current user on mount
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on window resize if it becomes desktop size
  // Prevent body scroll when menu is open
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 991) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Do you want to logout?');
    if (!confirmed) return;
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <>
      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={isMobileMenuOpen}
      >
        <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
      
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={toggleMobileMenu}
        ></div>
      )}
      
      <nav className={`navigation ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="nav-header">
          <div className="nav-header-logo-wrapper">
            <HospitalLogo size="small" shape="circle" />
          <h2>Hospital Management</h2>
          </div>
          {currentUser && (
            <div className="user-info">
              <span className="user-name">{currentUser.name || currentUser.email}</span>
              <span className="user-role">{currentUser.role}</span>
            </div>
          )}
        </div>
        <ul className="nav-menu">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || 
              (item.path === '/dashboard' && location.pathname === '/') ||
              (item.path === '/doctor-dashboard' && location.pathname === '/doctor-dashboard');
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="nav-icon"><SvgIcon name={item.icon} /></span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="nav-footer">
          <button className="nav-logout" onClick={handleLogout}>
            <span className="nav-icon"><SvgIcon name="logout" /></span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navigation;

