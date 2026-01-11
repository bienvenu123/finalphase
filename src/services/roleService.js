// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Role Service
 * Handles all API calls related to role management
 */

/**
 * Get all roles
 * @returns {Promise} Response data
 */
export const getRoles = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch roles');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single role by ID
 * @param {string} roleId - Role ID
 * @returns {Promise} Response data
 */
export const getRole = async (roleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch role');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new role
 * @param {Object} roleData - Role data { role_name, description }
 * @returns {Promise} Response data
 */
export const createRole = async (roleData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.errors?.join(', ') || 'Failed to create role');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing role
 * @param {string} roleId - Role ID
 * @param {Object} roleData - Updated role data { role_name, description }
 * @returns {Promise} Response data
 */
export const updateRole = async (roleId, roleData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.errors?.join(', ') || 'Failed to update role');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a role
 * @param {string} roleId - Role ID
 * @returns {Promise} Response data
 */
export const deleteRole = async (roleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete role');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

