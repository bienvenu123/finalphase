import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { login } from '../services/userService';
import { getCurrentUser, isAuthenticated, setAuthSession } from '../services/authService';
import HospitalLogo from '../components/HospitalLogo';
import './LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      const userRole = user?.role?.toLowerCase()?.trim();

      if (userRole === 'doctor') {
        navigate('/doctor-dashboard', { replace: true });
        return;
      }
      if (userRole === 'pr') {
        navigate('/pr-dashboard', { replace: true });
        return;
      }
      if (userRole === 'receptionist') {
        navigate('/patients', { replace: true });
        return;
      }
      if (userRole === 'user' || userRole === 'patient') {
        navigate('/user-dashboard', { replace: true });
        return;
      }

      navigate('/dashboard', { replace: true });
    }
    
    // Show session timeout message if redirected due to timeout
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [navigate, location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.email || !formData.password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }

      const response = await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim()
      });

      // login() returns data.data, which should be { user: {...}, token: "..." }
      // Handle different possible response structures
      const user = response?.user || response;
      const token = response?.token || user?._id || user?.id;

      if (!user || (typeof user !== 'object')) {
        throw new Error('Invalid response from server: user data not found');
      }

      const tokenToStore = token || user?._id;
      // Store auth session (sessionStorage by default unless Remember me is checked)
      setAuthSession({ user, token: tokenToStore, remember: rememberMe });

      const role = user?.role?.toLowerCase()?.trim();
      const from = location.state?.from?.pathname;

      // Role-based landing after login
      if (role === 'doctor') {
        navigate('/doctor-dashboard', { replace: true });
        return;
      }
      if (role === 'pr') {
        navigate('/pr-dashboard', { replace: true });
        return;
      }
      if (role === 'receptionist') {
        navigate('/patients', { replace: true });
        return;
      }
      if (role === 'user' || role === 'patient') {
        navigate('/user-dashboard', { replace: true });
        return;
      }

      // Fallback: honor deep link (if any), otherwise go to admin dashboard
      navigate(from || '/dashboard', { replace: true });

    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err.message ||
        'Invalid email or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <Link to="/" className="back-to-home">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Back to Home</span>
          </Link>
          
          <div className="branding-content">
            <div className="hospital-logo">
              <HospitalLogo size="large" shape="circle" />
            </div>
            <h1 className="hospital-name">Kigali Specialized Orthopaedic Hospital</h1>
            <p className="hospital-tagline">Excellence in Orthopaedic Care</p>
            <div className="branding-features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Secure Patient Portal</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>24/7 Access</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Expert Medical Care</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-section">
      <div className="login-card">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to access your account</p>
            </div>

            {error && (
              <div className="login-error">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M10 6V10M10 14H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>{typeof error === 'string' ? error : (error?.message || 'An error occurred')}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 6.66667L9.0755 11.0504C9.63533 11.4236 10.3647 11.4236 10.9245 11.0504L17.5 6.66667M4.16667 15.8333H15.8333C16.7538 15.8333 17.5 15.0871 17.5 14.1667V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V14.1667C2.5 15.0871 3.24619 15.8333 4.16667 15.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
            <input
              type="email"
                    id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
                    placeholder="Enter your email"
              required
                    autoComplete="email"
            />
                </div>
          </div>

          <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.8333 9.16667H4.16667C3.24619 9.16667 2.5 9.91286 2.5 10.8333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V10.8333C17.5 9.91286 16.7538 9.16667 15.8333 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5.83333 9.16667V5.83333C5.83333 4.72826 6.27232 3.66846 7.05372 2.88706C7.83512 2.10565 8.89493 1.66667 9.99999 1.66667C11.1051 1.66667 12.1649 2.10565 12.9463 2.88706C13.7277 3.66846 14.1667 4.72826 14.1667 5.83333V9.16667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
            <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
                    placeholder="Enter your password"
              required
                    autoComplete="current-password"
            />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 2.5L17.5 17.5M8.33333 8.33333C7.89131 8.77535 7.5 9.44102 7.5 10.4167C7.5 11.5208 8.39583 12.4167 9.5 12.4167C10.4757 12.4167 11.1413 12.0253 11.5833 11.5833M5.41667 5.41667C4.39167 6.25 3.33333 7.5 2.5 10C3.33333 12.5 4.39167 13.75 5.41667 14.5833C6.66667 15.5833 8.33333 16.25 10 16.25C11.6667 16.25 13.3333 15.5833 14.5833 14.5833L5.41667 5.41667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 10C2.5 7.5 3.33333 6.25 4.16667 5.41667C5.41667 4.41667 7.08333 3.75 8.75 3.75C10.4167 3.75 12.0833 4.41667 13.3333 5.41667C14.1667 6.25 15 7.5 15 10C15 12.5 14.1667 13.75 13.3333 14.5833C12.0833 15.5833 10.4167 16.25 8.75 16.25C7.08333 16.25 5.41667 15.5833 4.16667 14.5833C3.33333 13.75 2.5 12.5 2.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    disabled={loading}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="#" className="forgot-password">Forgot password?</Link>
          </div>

              <button 
                type="submit" 
                className="btn-login"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="spinner" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416;0 31.416" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416;-31.416" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
          </button>
        </form>

            <div className="login-footer">
              <p>Don't have an account? <Link to="/contact">Contact us</Link> to get started.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
