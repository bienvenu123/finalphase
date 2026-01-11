// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Appointment Service
 * Handles all API calls related to appointment management
 */

/**
 * Get all appointments with optional filters
 * @param {Object} filters - Optional filters { status, date, doctor_id, patient_id }
 * @returns {Promise} Response data
 */
export const getAppointments = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.status) {
      queryParams.append('status', filters.status);
    }
    
    if (filters.date) {
      queryParams.append('date', filters.date);
    }
    
    if (filters.doctor_id) {
      queryParams.append('doctor_id', filters.doctor_id);
    }
    
    if (filters.patient_id) {
      queryParams.append('patient_id', filters.patient_id);
    }
    
    const url = `${API_BASE_URL}/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch appointments');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single appointment by ID
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise} Response data
 */
export const getAppointment = async (appointmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch appointment');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new appointment
 * @param {Object} appointmentData - Appointment data { patient_id, doctor_id, department_id, appointment_date, appointment_time, reason, status }
 * @returns {Promise} Response data
 */
export const createAppointment = async (appointmentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Create error with detailed information
      const error = new Error(data.message || data.errors?.join(', ') || 'Failed to create appointment');
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
    throw error;
  }
};

/**
 * Update an existing appointment
 * @param {string} appointmentId - Appointment ID
 * @param {Object} appointmentData - Updated appointment data { patient_id, doctor_id, department_id, appointment_date, appointment_time, reason, status }
 * @returns {Promise} Response data
 */
export const updateAppointment = async (appointmentId, appointmentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.errors?.join(', ') || 'Failed to update appointment');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete an appointment
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise} Response data
 */
export const deleteAppointment = async (appointmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete appointment');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get appointments by patient ID
 * @param {string} patientId - Patient ID
 * @returns {Promise} Response data
 */
export const getAppointmentsByPatient = async (patientId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/patient/${patientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch appointments by patient');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get appointments by doctor ID
 * @param {string} doctorId - Doctor ID
 * @returns {Promise} Response data
 */
export const getAppointmentsByDoctor = async (doctorId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/doctor/${doctorId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch appointments by doctor');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

