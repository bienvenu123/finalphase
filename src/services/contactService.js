// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Contact Service
 * Handles all API calls related to contact form submissions
 */

/**
 * Get all contacts
 * @returns {Promise} Response data
 */
export const getContacts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/contacts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.message || 
                          data.error || 
                          (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
                          `Failed to fetch contacts (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getContacts:', error);
    throw error;
  }
};

/**
 * Get single contact by ID
 * @param {string} id - Contact ID
 * @returns {Promise} Response data
 */
export const getContact = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.message || 
                          data.error || 
                          `Failed to fetch contact (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getContact:', error);
    throw error;
  }
};

/**
 * Create new contact
 * @param {Object} contactData - Contact form data
 * @returns {Promise} Response data
 */
export const createContact = async (contactData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.message || 
                          data.error || 
                          (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
                          `Failed to create contact (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createContact:', error);
    throw error;
  }
};

/**
 * Delete contact
 * @param {string} id - Contact ID
 * @returns {Promise} Response data
 */
export const deleteContact = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.message || 
                          data.error || 
                          `Failed to delete contact (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in deleteContact:', error);
    throw error;
  }
};

