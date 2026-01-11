// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Insurance Service
 * Handles all API calls related to insurance management
 */

/**
 * Get all insurances
 * @returns {Promise} Response data
 */
export const getInsurances = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/insurances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response. Status: ${response.status}. Please check if the backend API route '/api/insurances' is configured correctly.`);
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.message || 
                          data.error || 
                          (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
                          `Failed to fetch insurances (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    // If it's already our custom error, re-throw it
    if (error.message.includes('non-JSON response')) {
      throw error;
    }
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Get a single insurance by ID
 * @param {string} insuranceId - Insurance ID
 * @returns {Promise} Response data
 */
export const getInsurance = async (insuranceId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/insurances/${insuranceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response. Status: ${response.status}. Please check if the backend API route '/api/insurances' is configured correctly.`);
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch insurance');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new insurance
 * @param {Object} insuranceData - Insurance data { insurance_name }
 * @returns {Promise} Response data
 */
export const createInsurance = async (insuranceData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/insurances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(insuranceData),
    });
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response. Status: ${response.status}. Please check if the backend API route '/api/insurances' is configured correctly.`);
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.message || 'Failed to create insurance';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    // If it's already our custom error, re-throw it
    if (error.message.includes('non-JSON response')) {
      throw error;
    }
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Update an existing insurance
 * @param {string} insuranceId - Insurance ID
 * @param {Object} insuranceData - Updated insurance data { insurance_name }
 * @returns {Promise} Response data
 */
export const updateInsurance = async (insuranceId, insuranceData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/insurances/${insuranceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(insuranceData),
    });
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response. Status: ${response.status}. Please check if the backend API route '/api/insurances' is configured correctly.`);
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.message || 'Failed to update insurance';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    // If it's already our custom error, re-throw it
    if (error.message.includes('non-JSON response')) {
      throw error;
    }
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Delete an insurance
 * @param {string} insuranceId - Insurance ID
 * @returns {Promise} Response data
 */
export const deleteInsurance = async (insuranceId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/insurances/${insuranceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response. Status: ${response.status}. Please check if the backend API route '/api/insurances' is configured correctly.`);
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete insurance');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

