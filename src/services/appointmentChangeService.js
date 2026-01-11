// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Appointment Change Service
 * Handles all API calls related to appointment change management
 */

/**
 * Get all appointment changes with optional filters
 * @param {Object} filters - Optional filters { appointment_id, change_type }
 * @returns {Promise} Response data
 */
export const getAppointmentChanges = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.appointment_id) {
      queryParams.append('appointment_id', filters.appointment_id);
    }
    
    if (filters.change_type) {
      queryParams.append('change_type', filters.change_type);
    }
    
    const url = `${API_BASE_URL}/appointment-changes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch appointment changes');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single appointment change by ID
 * @param {string} changeId - Appointment Change ID
 * @returns {Promise} Response data
 */
export const getAppointmentChange = async (changeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointment-changes/${changeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch appointment change');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new appointment change
 * @param {Object} changeData - Change data { appointment_id, change_type, reason, changed_at }
 * @returns {Promise} Response data
 */
export const createAppointmentChange = async (changeData) => {
  try {
    console.log('📤 Sending appointment change data:', changeData);
    console.log('📤 API URL:', `${API_BASE_URL}/appointment-changes`);
    
    const response = await fetch(`${API_BASE_URL}/appointment-changes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(changeData),
    });
    
    console.log('📥 Response status:', response.status, response.statusText);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📥 Response data:', data);
    
    if (!response.ok) {
      const errorMessage = data.message || data.error || data.errors?.join(', ') || 'Failed to create appointment change';
      console.error('❌ API Error:', errorMessage);
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Network/Parse Error:', error);
    // If it's already our custom error, re-throw it
    if (error.status) {
      throw error;
    }
    // Network or JSON parse errors
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Update an existing appointment change
 * @param {string} changeId - Appointment Change ID
 * @param {Object} changeData - Updated change data { appointment_id, change_type, reason }
 * @returns {Promise} Response data
 */
export const updateAppointmentChange = async (changeId, changeData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointment-changes/${changeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(changeData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.errors?.join(', ') || 'Failed to update appointment change');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete an appointment change
 * @param {string} changeId - Appointment Change ID
 * @returns {Promise} Response data
 */
export const deleteAppointmentChange = async (changeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointment-changes/${changeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete appointment change');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get changes by appointment ID
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise} Response data
 */
export const getChangesByAppointment = async (appointmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointment-changes/appointment/${appointmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch changes by appointment');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

