// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Notification Service
 * Handles all API calls related to notification management
 */

/**
 * Get all notifications with optional filters
 * @param {Object} filters - Optional filters { user_id, notification_type, is_read }
 * @returns {Promise} Response data
 */
export const getNotifications = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.user_id) {
      queryParams.append('user_id', filters.user_id);
    }
    
    if (filters.notification_type) {
      queryParams.append('notification_type', filters.notification_type);
    }
    
    if (filters.is_read !== undefined) {
      queryParams.append('is_read', filters.is_read);
    }
    
    const url = `${API_BASE_URL}/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch notifications');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single notification by ID
 * @param {string} notificationId - Notification ID
 * @returns {Promise} Response data
 */
export const getNotification = async (notificationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch notification');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new notification
 * @param {Object} notificationData - Notification data { user_id, message, notification_type, sent_at }
 * @returns {Promise} Response data
 */
export const createNotification = async (notificationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.errors?.join(', ') || 'Failed to create notification');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing notification
 * @param {string} notificationId - Notification ID
 * @param {Object} notificationData - Updated notification data { user_id, message, notification_type, is_read }
 * @returns {Promise} Response data
 */
export const updateNotification = async (notificationId, notificationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.errors?.join(', ') || 'Failed to update notification');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise} Response data
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete notification');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get notifications by user ID
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters { is_read, notification_type }
 * @returns {Promise} Response data
 */
export const getNotificationsByUser = async (userId, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.is_read !== undefined) {
      queryParams.append('is_read', filters.is_read);
    }
    
    if (filters.notification_type) {
      queryParams.append('notification_type', filters.notification_type);
    }
    
    const url = `${API_BASE_URL}/notifications/user/${userId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch notifications by user');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise} Response data
 */
export const markAsRead = async (notificationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to mark notification as read');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise} Response data
 */
export const markAllAsRead = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/read-all`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to mark all notifications as read');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

