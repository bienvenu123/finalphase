// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Audit Log Service
 * Handles all API calls related to audit log management
 */

// Enhanced error handling
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  // Log response details for debugging
  console.log('Response details:', {
    status: response.status,
    statusText: response.statusText,
    contentType: contentType,
    url: response.url
  });
  
  // Clone response to read it multiple times if needed
  const responseClone = response.clone();
  
  // If response is not OK, throw error
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      // Try to parse error as JSON first
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // If not JSON, try to get text
      try {
        const text = await responseClone.text();
        if (text && text.includes('<!DOCTYPE')) {
          // It's an HTML error page (404)
          throw new Error('ENDPOINT_NOT_FOUND');
        } else if (text) {
          errorMessage = text.substring(0, 200);
        }
      } catch (textError) {
        // Keep default error message
      }
    }
    
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }
  
  // Check if response is JSON
  if (!contentType || !contentType.includes('application/json')) {
    console.warn('Response is not JSON:', contentType);
    const text = await responseClone.text();
    console.warn('Response text:', text.substring(0, 200));
    
    // If it's HTML (likely 404 page), throw specific error
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      const error = new Error('ENDPOINT_NOT_FOUND');
      error.status = 404;
      throw error;
    }
    
    const error = new Error('Invalid response format from server');
    error.status = response.status;
    throw error;
  }
  
  // Parse and return JSON
  try {
    return await response.json();
  } catch (jsonError) {
    console.error('Failed to parse JSON response:', jsonError);
    const text = await responseClone.text();
    console.error('Response text:', text.substring(0, 500));
    
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      const error = new Error('ENDPOINT_NOT_FOUND');
      error.status = 404;
      throw error;
    }
    
    throw new Error('Failed to parse response as JSON');
  }
};

/**
 * Get all audit logs with optional filters
 * @param {Object} filters - Optional filters { user_id, action_type, entity_type, start_date, end_date }
 * @returns {Promise} Response data
 */
export const getAuditLogs = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    if (filters.user_id) queryParams.append('user_id', filters.user_id);
    if (filters.action_type) queryParams.append('action_type', filters.action_type);
    if (filters.entity_type) queryParams.append('entity_type', filters.entity_type);
    if (filters.start_date) queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);
    
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/audit-logs${queryString ? '?' + queryString : ''}`;
    
    console.log('🔍 Fetching audit logs from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('❌ Error in getAuditLogs:', error);
    
    // Handle specific error types
    if (error.message === 'ENDPOINT_NOT_FOUND' || error.status === 404) {
      const endpointError = new Error('ENDPOINT_NOT_FOUND');
      endpointError.status = 404;
      throw endpointError;
    }
    
    // Network errors (fetch fails completely)
    if (error.name === 'TypeError' || 
        error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('Network request failed')) {
      const networkError = new Error('ENDPOINT_NOT_AVAILABLE');
      networkError.status = 0;
      networkError.originalError = error.message;
      throw networkError;
    }
    
    throw error;
  }
};

/**
 * Get a single audit log by ID
 * @param {string} logId - Audit Log ID
 * @returns {Promise} Response data
 */
export const getAuditLog = async (logId) => {
  try {
    const url = `${API_BASE_URL}/audit-logs/${logId}`;
    console.log('🔍 Fetching audit log from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('❌ Error in getAuditLog:', error);
    throw error;
  }
};

/**
 * Get audit logs by user ID
 * @param {string} userId - User ID
 * @returns {Promise} Response data
 */
export const getAuditLogsByUser = async (userId) => {
  try {
    const url = `${API_BASE_URL}/audit-logs/user/${userId}`;
    console.log('🔍 Fetching audit logs by user from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('❌ Error in getAuditLogsByUser:', error);
    
    // Handle specific error types
    if (error.message === 'ENDPOINT_NOT_FOUND' || error.message.includes('404')) {
      const endpointError = new Error('ENDPOINT_NOT_FOUND');
      endpointError.status = 404;
      throw endpointError;
    }
    
    throw error;
  }
};

/**
 * Get audit logs by entity type
 * @param {string} entityType - Entity type (e.g., 'user', 'appointment', 'patient')
 * @returns {Promise} Response data
 */
export const getAuditLogsByEntityType = async (entityType) => {
  try {
    const url = `${API_BASE_URL}/audit-logs/entity/${entityType}`;
    console.log('🔍 Fetching audit logs by entity from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('❌ Error in getAuditLogsByEntityType:', error);
    
    // Handle specific error types
    if (error.message === 'ENDPOINT_NOT_FOUND' || error.message.includes('404')) {
      const endpointError = new Error('ENDPOINT_NOT_FOUND');
      endpointError.status = 404;
      throw endpointError;
    }
    
    throw error;
  }
};

/**
 * Test connection to backend
 * @returns {Promise<boolean>} True if connection successful
 */
export const testAuditLogsConnection = async () => {
  try {
    const url = `${API_BASE_URL}/audit-logs`;
    console.log('🧪 Testing connection to:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🧪 Connection test result:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url,
      contentType: response.headers.get('content-type')
    });
    
    // Check if it's a valid JSON response (even if error)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return true; // Endpoint exists, even if it returns an error
    }
    
    // If HTML response, endpoint doesn't exist
    if (contentType && contentType.includes('text/html')) {
      console.warn('🧪 Endpoint returned HTML (likely 404 page)');
      return false;
    }
    
    return response.ok;
  } catch (error) {
    console.error('🧪 Connection test failed:', error);
    console.error('🧪 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
};
