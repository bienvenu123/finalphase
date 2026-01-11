// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Appointment Status History Service
 * Handles all API calls related to appointment status history management
 */

/**
 * Get all appointment status history records with optional filters
 * @param {Object} filters - Optional filters { appointment_id }
 * @returns {Promise} Response data
 */
export const getAppointmentStatusHistory = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.appointment_id) {
      queryParams.append('appointment_id', filters.appointment_id);
    }
    
    const url = `${API_BASE_URL}/appointment-status-history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch appointment status history');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single appointment status history record by ID
 * @param {string} historyId - Appointment Status History ID
 * @returns {Promise} Response data
 */
export const getAppointmentStatusHistoryRecord = async (historyId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointment-status-history/${historyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch appointment status history record');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new appointment status history record
 * @param {Object} historyData - History data { appointment_id, old_status, new_status, changed_by }
 * @returns {Promise} Response data
 */
export const createAppointmentStatusHistory = async (historyData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointment-status-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(historyData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.errors?.join(', ') || 'Failed to create appointment status history');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing appointment status history record
 * @param {string} historyId - Appointment Status History ID
 * @param {Object} historyData - Updated history data { appointment_id, old_status, new_status, changed_by }
 * @returns {Promise} Response data
 */
export const updateAppointmentStatusHistory = async (historyId, historyData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointment-status-history/${historyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(historyData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.errors?.join(', ') || 'Failed to update appointment status history');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete an appointment status history record
 * @param {string} historyId - Appointment Status History ID
 * @returns {Promise} Response data
 */
export const deleteAppointmentStatusHistory = async (historyId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointment-status-history/${historyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete appointment status history record');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get status history by appointment ID
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise} Response data
 */
export const getStatusHistoryByAppointment = async (appointmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointment-status-history/appointment/${appointmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch status history by appointment');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

