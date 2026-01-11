// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Department Service
 * Handles all API calls related to department management
 */

/**
 * Get all departments
 * @returns {Promise} Response data
 */
export const getDepartments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch departments');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single department by ID
 * @param {string} departmentId - Department ID
 * @returns {Promise} Response data
 */
export const getDepartment = async (departmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch department');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new department
 * @param {Object} departmentData - Department data { department_name, description, status }
 * @returns {Promise} Response data
 */
export const createDepartment = async (departmentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(departmentData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.errors?.join(', ') || 'Failed to create department');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing department
 * @param {string} departmentId - Department ID
 * @param {Object} departmentData - Updated department data { department_name, description, status }
 * @returns {Promise} Response data
 */
export const updateDepartment = async (departmentId, departmentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(departmentData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.errors?.join(', ') || 'Failed to update department');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a department
 * @param {string} departmentId - Department ID
 * @returns {Promise} Response data
 */
export const deleteDepartment = async (departmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete department');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

