// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Doctor Service
 * Handles all API calls related to doctor management
 */

/**
 * Get all doctors
 * @returns {Promise} Response data
 */
export const getDoctors = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Provide more detailed error information
      const errorMessage = data.message || 
                          data.error || 
                          (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
                          `Failed to fetch doctors (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error.status) {
      throw error;
    }
    // Network or other errors
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Get a single doctor by ID
 * @param {string} doctorId - Doctor ID
 * @returns {Promise} Response data
 */
export const getDoctor = async (doctorId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch doctor');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new doctor
 * @param {Object} doctorData - Doctor data { first_name, last_name, gender, phone, email, specialization, department_id, status }
 * @returns {Promise} Response data
 */
export const createDoctor = async (doctorData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doctorData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle validation errors from backend
      const errorMessage = data.message || 'Failed to create doctor';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data; // Include full error data (with errors array)
      throw error;
    }
    
    return data;
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error.status) {
      throw error;
    }
    // Network or other errors
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Update an existing doctor
 * @param {string} doctorId - Doctor ID
 * @param {Object} doctorData - Updated doctor data { first_name, last_name, gender, phone, email, specialization, department_id, status }
 * @returns {Promise} Response data
 */
export const updateDoctor = async (doctorId, doctorData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doctorData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle validation errors from backend
      const errorMessage = data.message || 'Failed to update doctor';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data; // Include full error data (with errors array)
      throw error;
    }
    
    return data;
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error.status) {
      throw error;
    }
    // Network or other errors
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Delete a doctor
 * @param {string} doctorId - Doctor ID
 * @returns {Promise} Response data
 */
export const deleteDoctor = async (doctorId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.message || 'Failed to delete doctor';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error.status) {
      throw error;
    }
    // Network or other errors
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Get doctors by department ID
 * @param {string} departmentId - Department ID
 * @returns {Promise} Response data
 */
export const getDoctorsByDepartment = async (departmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors/department/${departmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch doctors by department');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

