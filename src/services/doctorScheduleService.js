// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Doctor Schedule Service
 * Handles all API calls related to doctor schedule management
 */

/**
 * Get all doctor schedules
 * @returns {Promise} Response data
 */
export const getDoctorSchedules = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctor-schedules`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
     
    const data = await response.json();
    
    if (!response.ok) {
      // Handle CastError (invalid ID format) from backend
      if (data.message === 'Invalid schedule ID format' || data.message === 'Invalid ID format') {
        const error = new Error(data.message || 'Invalid ID format');
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
                          `Failed to fetch doctor schedules (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single doctor schedule by ID
 * @param {string} scheduleId - Doctor Schedule ID
 * @returns {Promise} Response data
 */
export const getDoctorSchedule = async (scheduleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctor-schedules/${scheduleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle CastError (invalid ID format) from backend
      if (data.message === 'Invalid schedule ID format') {
        const error = new Error(data.message || 'Invalid schedule ID format');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      if (data.message === 'Doctor schedule not found') {
        const error = new Error(data.message || 'Doctor schedule not found');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      const errorMessage = data.message || 
                          data.error || 
                          `Failed to fetch doctor schedule (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new doctor schedule
 * @param {Object} scheduleData - Doctor schedule data { doctor_id, day_of_week, start_time, end_time, max_patients }
 * @returns {Promise} Response data
 */
export const createDoctorSchedule = async (scheduleData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctor-schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle specific backend error messages
      if (data.message === 'Doctor not found') {
        const error = new Error(data.message || 'Doctor not found');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      if (data.message === 'Doctor already has a schedule for this day with overlapping time') {
        const error = new Error(data.message);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      if (data.message === 'End time must be after start time') {
        const error = new Error(data.message);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      if (data.message === 'Invalid doctor ID format') {
        const error = new Error(data.message || 'Invalid doctor ID format');
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
                          `Failed to create doctor schedule (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing doctor schedule
 * @param {string} scheduleId - Doctor Schedule ID
 * @param {Object} scheduleData - Updated doctor schedule data { doctor_id, day_of_week, start_time, end_time, max_patients }
 * @returns {Promise} Response data
 */
export const updateDoctorSchedule = async (scheduleId, scheduleData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctor-schedules/${scheduleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle specific backend error messages
      if (data.message === 'Doctor schedule not found') {
        const error = new Error(data.message || 'Doctor schedule not found');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      if (data.message === 'Doctor not found') {
        const error = new Error(data.message || 'Doctor not found');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      if (data.message === 'Doctor already has a schedule for this day with overlapping time') {
        const error = new Error(data.message);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      if (data.message === 'End time must be after start time') {
        const error = new Error(data.message);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      if (data.message === 'Invalid ID format') {
        const error = new Error(data.message || 'Invalid ID format');
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
                          `Failed to update doctor schedule (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a doctor schedule
 * @param {string} scheduleId - Doctor Schedule ID
 * @returns {Promise} Response data
 */
export const deleteDoctorSchedule = async (scheduleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctor-schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (data.message === 'Doctor schedule not found') {
        const error = new Error(data.message || 'Doctor schedule not found');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      if (data.message === 'Invalid schedule ID format') {
        const error = new Error(data.message || 'Invalid schedule ID format');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      const error = new Error(data.message || 'Failed to delete doctor schedule');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get doctor schedules by doctor ID
 * @param {string} doctorId - Doctor ID
 * @returns {Promise} Response data
 */
export const getSchedulesByDoctor = async (doctorId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctor-schedules/doctor/${doctorId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (data.message === 'Doctor not found') {
        const error = new Error(data.message || 'Doctor not found');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      if (data.message === 'Invalid doctor ID format') {
        const error = new Error(data.message || 'Invalid doctor ID format');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      const errorMessage = data.message || 
                          data.error || 
                          (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
                          `Failed to fetch schedules by doctor (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Notify patients about schedule changes via email
 * POST /api/doctor-schedules/notify-schedule-change
 * @param {Object} notificationData - Notification data { schedule_id, old_schedule, new_schedule, appointment_ids }
 * @returns {Promise} Response data
 */
export const notifyScheduleChange = async (notificationData) => {
  try {
    const url = `${API_BASE_URL}/doctor-schedules/notify-schedule-change`;
    console.log('Calling notify-schedule-change endpoint:', url);
    console.log('Payload:', JSON.stringify(notificationData, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // If not JSON, read as text to see what we got
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 500));
      throw new Error(`Server returned non-JSON response (Status: ${response.status}). This usually means the endpoint doesn't exist or there's a server error. Check backend routes.`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      // Handle specific backend error messages
      if (data.message === 'Schedule not found') {
        const error = new Error(data.message || 'Schedule not found');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      if (data.message === 'No appointments found for the provided IDs') {
        const error = new Error(data.message || 'No appointments found');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      if (data.message === 'Missing required fields') {
        const error = new Error(data.message || 'Missing required fields');
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
                          `Failed to send schedule change notifications (Status: ${response.status})`;
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

