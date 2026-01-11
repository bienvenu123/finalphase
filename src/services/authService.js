// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Auth Service
 * Handles all API calls related to authentication
 */

// CONFIGURATION: Update this endpoint path to match your backend
// Common options:
// - /auth/login (default)
// - /users/login
// - /login
const LOGIN_ENDPOINT = '/users/login'; // Change this if your backend uses a different path

// Storage helpers:
// - Default to sessionStorage (safer on shared computers)
// - Use localStorage only when "Remember me" is enabled
const getStorage = (remember = false) => (remember ? localStorage : sessionStorage);
const STORAGE_KEYS = { token: 'token', user: 'user' };

export const setAuthSession = ({ user, token, remember = false }) => {
  const storage = getStorage(remember);
  if (token) storage.setItem(STORAGE_KEYS.token, token);
  if (user) storage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
};

/**
 * Login user with email and password
 * @param {Object} credentials - { email, password }
 * @returns {Promise} Response data with user info and token
 */
export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, it might be an HTML error page
        const text = await response.text();
        console.error('Failed to parse JSON response:', text.substring(0, 200));
        
        if (response.status === 404) {
          throw new Error(
            `Login endpoint not found at ${API_BASE_URL}${LOGIN_ENDPOINT}\n\n` +
            `Please ensure:\n` +
            `1. Your backend server is running on ${API_BASE_URL.replace('/api', '')}\n` +
            `2. You have created a POST endpoint at ${LOGIN_ENDPOINT}\n` +
            `3. Or update LOGIN_ENDPOINT in src/services/authService.js to match your backend path\n\n` +
            `See BACKEND_LOGIN_ENDPOINT.md for backend implementation guide.`
          );
        }
        
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later or contact support.');
        }
        
        throw new Error(`Server returned an invalid response. Status: ${response.status}`);
      }
    } else {
      // Response is not JSON (likely HTML error page)
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      
      if (response.status === 404) {
        throw new Error(
          `Login endpoint not found at ${API_BASE_URL}${LOGIN_ENDPOINT}\n\n` +
          `Please ensure:\n` +
          `1. Your backend server is running on ${API_BASE_URL.replace('/api', '')}\n` +
          `2. You have created a POST endpoint at ${LOGIN_ENDPOINT}\n` +
          `3. Or update LOGIN_ENDPOINT in src/services/authService.js to match your backend path\n\n` +
          `See BACKEND_LOGIN_ENDPOINT.md for backend implementation guide.`
        );
      }
      
      if (response.status >= 500) {
        throw new Error('Server error. Please try again later or contact support.');
      }
      
      throw new Error(`Server returned an unexpected response. Status: ${response.status}`);
    }
    
    if (!response.ok) {
      // Handle specific error messages
      if (data.message === 'Invalid credentials' || data.message === 'Invalid email or password') {
        const error = new Error(data.message || 'Invalid email or password');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      if (data.message === 'User not found') {
        const error = new Error(data.message || 'User not found');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      // Handle ValidationError
      if (data.message === 'Validation error' && data.errors) {
        const error = new Error(Array.isArray(data.errors) ? data.errors.join(', ') : data.message);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      const errorMessage = data.message || 
                          data.error || 
                          (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
                          `Failed to login (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    // Store token and user info in localStorage
    if (data.token) {
      localStorage.setItem(STORAGE_KEYS.token, data.token);
    }
    
    if (data.data) {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.data));
    }
    
    return data;
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error.status || error.message.includes('endpoint not found') || error.message.includes('Server error') || error.message.includes('unexpected response')) {
      throw error;
    }
    
    // Check for network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to the server. Please check if the backend server is running and the API URL is correct.');
    }
    
    // Check for JSON parsing errors
    if (error.message.includes('JSON') || error.message.includes('Unexpected token')) {
      throw new Error('Server returned an invalid response. Please check if the backend server is running and the API URL is correct.');
    }
    
    // Network or other errors
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Logout user
 * Removes token and user info from localStorage
 */
export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  sessionStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(STORAGE_KEYS.user);
};

/**
 * Get current user from localStorage
 * @returns {Object|null} User object or null
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem(STORAGE_KEYS.user) || sessionStorage.getItem(STORAGE_KEYS.user);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

/**
 * Get auth token from localStorage
 * @returns {string|null} Token or null
 */
export const getToken = () => {
  return localStorage.getItem(STORAGE_KEYS.token) || sessionStorage.getItem(STORAGE_KEYS.token);
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists
 */
export const isAuthenticated = () => {
  return !!getToken();
};

