// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Medical Record Service
 * Handles all API calls related to medical record management
 */

/**
 * Get all medical records
 * @returns {Promise} Response data
 */
export const getMedicalRecords = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/medical-records`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch medical records');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single medical record by ID
 * @param {string} recordId - Medical Record ID
 * @returns {Promise} Response data
 */
export const getMedicalRecord = async (recordId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/medical-records/${recordId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch medical record');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new medical record
 * @param {Object} recordData - Medical record data { patient_id, diagnosis, treatment_notes }
 * @returns {Promise} Response data
 */
export const createMedicalRecord = async (recordData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/medical-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.errors?.join(', ') || 'Failed to create medical record');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing medical record
 * @param {string} recordId - Medical Record ID
 * @param {Object} recordData - Updated medical record data { patient_id, diagnosis, treatment_notes }
 * @returns {Promise} Response data
 */
export const updateMedicalRecord = async (recordId, recordData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/medical-records/${recordId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.errors?.join(', ') || 'Failed to update medical record');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a medical record
 * @param {string} recordId - Medical Record ID
 * @returns {Promise} Response data
 */
export const deleteMedicalRecord = async (recordId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/medical-records/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete medical record');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get medical records by patient ID
 * @param {string} patientId - Patient ID
 * @returns {Promise} Response data
 */
export const getRecordsByPatient = async (patientId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/medical-records/patient/${patientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch medical records by patient');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

