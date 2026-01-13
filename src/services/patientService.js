// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://finalhospital-three.vercel.app/api';

/**
 * Patient Service
 * Handles all API calls related to patient management
 */

/**
 * Get all patients
 * @returns {Promise} Response data with structure { success, count, data }
 */
export const getPatients = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      // Provide more detailed error information
      const errorMessage = data.message || 
                          data.error || 
                          (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
                          `Failed to fetch patients (Status: ${response.status})`;
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
 * Get a single patient by ID
 * @param {string} patientId - Patient ID
 * @returns {Promise} Response data with structure { success, data }
 */
export const getPatient = async (patientId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      const errorMessage = data.message || 'Failed to fetch patient';
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
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Create a new patient
 * @param {Object} patientData - Patient data { first_name, last_name, gender, date_of_birth, phone, email, address: { district, sector }, origin, insurance, patient_id }
 * @returns {Promise} Response data with structure { success, data }
 */
export const createPatient = async (patientData) => {
  try {
    // Ensure origin is in the data (backend requires it)
    if (!patientData.origin || patientData.origin.trim() === '') {
      patientData.origin = 'Rwandan';
    }
    
    // Only include patient_id if provided and not empty (backend will auto-generate if not provided)
    const requestData = { ...patientData };
    if (!requestData.patient_id || requestData.patient_id.trim() === '') {
      delete requestData.patient_id;
    } else {
      requestData.patient_id = requestData.patient_id.trim();
    }
    
    // Only include insurance if provided and not empty
    if (!requestData.insurance || requestData.insurance.trim() === '') {
      delete requestData.insurance;
    }
    
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response. Status: ${response.status}. Response: ${text.substring(0, 200)}`);
    }
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      // Handle validation errors from backend
      const errorMessage = data.message || 
                          (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
                          'Failed to create patient';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data; // Include full error data (with errors array)
      throw error;
    }
    
    return data;
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error.status || error.message.includes('non-JSON')) {
      throw error;
    }
    // Network or other errors
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Update an existing patient
 * @param {string} patientId - Patient ID
 * @param {Object} patientData - Updated patient data { first_name, last_name, gender, date_of_birth, phone, email, address: { district, sector }, origin, insurance, patient_id }
 * @returns {Promise} Response data with structure { success, data }
 */
export const updatePatient = async (patientId, patientData) => {
  try {
    // Prepare update data - handle patient_id and insurance properly
    const requestData = { ...patientData };
    
    // If patient_id is empty string, don't send it (backend will preserve existing)
    if (requestData.patient_id !== undefined && (!requestData.patient_id || requestData.patient_id.trim() === '')) {
      // Don't include it in the request - backend will preserve existing value
      delete requestData.patient_id;
    } else if (requestData.patient_id) {
      requestData.patient_id = requestData.patient_id.trim();
    }
    
    // If insurance is empty string, set to null (backend expects null or valid ID)
    if (requestData.insurance !== undefined && (!requestData.insurance || requestData.insurance.trim() === '')) {
      requestData.insurance = null;
    }
    
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      // Handle validation errors from backend
      const errorMessage = data.message || 
                          (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
                          'Failed to update patient';
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
 * Delete a patient
 * @param {string} patientId - Patient ID
 * @returns {Promise} Response data with structure { success, message }
 */
export const deletePatient = async (patientId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      const errorMessage = data.message || 'Failed to delete patient';
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
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Search patients by query
 * @param {string} query - Search query (searches first_name, last_name, email, phone, patient_id)
 * @returns {Promise} Response data with structure { success, count, data }
 */
export const searchPatients = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/search/${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      const errorMessage = data.message || 'Failed to search patients';
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
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Get patient by patient_id (the generated ID like PAT-000001)
 * @param {string} patientId - Patient ID (e.g., PAT-000001)
 * @returns {Promise} Response data with structure { success, data }
 */
export const getPatientByPatientId = async (patientId) => {
  try {
    // Use the dedicated endpoint for searching by patient_id
    const response = await fetch(`${API_BASE_URL}/patients/patient-id/${encodeURIComponent(patientId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      const errorMessage = data.message || 'Patient not found';
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
    throw new Error(`Network error: ${error.message}`);
  }
};

