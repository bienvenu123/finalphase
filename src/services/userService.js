// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * User Service
 * Handles all API calls related to user management
 */

/**
 * Get all users with optional filters
 * @param {Object} filters - Optional filters { role }
 * @returns {Promise} Response data
 */
export const getUsers = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Note: Backend doesn't support filtering by role in getUsers endpoint
    // Filtering is done client-side if needed
    // If backend adds role filtering, uncomment below:
    // if (filters.role) {
    //   queryParams.append('role', filters.role);
    // }
    
    const url = `${API_BASE_URL}/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      const errorMessage = data.message || 
                          data.error || 
                          (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
                          `Failed to fetch users (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single user by ID
 * @param {string} userId - User ID
 * @returns {Promise} Response data
 */
export const getUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      const errorMessage = data.message || 
                          data.error || 
                          `Failed to fetch user (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new user
 * @param {Object} userData - User data { name, email, password, phone, role }
 * @returns {Promise} Response data
 */
export const createUser = async (userData) => {
  try {
    // Validate and clean data before sending
    const cleanData = {
      name: userData.name ? userData.name.trim() : '',
      email: userData.email ? userData.email.trim().toLowerCase() : '',
      password: userData.password || '',
      phone: userData.phone ? userData.phone.trim() : '',
      role: userData.role || ''
    };
    
    console.log('Creating user with data:', { ...cleanData, password: cleanData.password ? '***' : 'not provided' });
    
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanData),
    });
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If response is not JSON, create error with status text
      const error = new Error(`Server error: ${response.status} ${response.statusText}`);
      error.status = response.status;
      error.data = { message: `Server error: ${response.status} ${response.statusText}` };
      throw error;
    }
    
    if (!response.ok || !data.success) {
      console.error('Create user error response:', data);
      
      // Handle validation errors
      if (data.message === 'Validation error' && data.errors) {
        const error = new Error(Array.isArray(data.errors) ? data.errors.join(', ') : data.message);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      // Handle duplicate email
      if (data.message === 'User with this email already exists' || data.message?.includes('already exists')) {
        const error = new Error(data.message || 'Email already exists');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      // Show detailed error message
      const errorMessage = data.message || 
                          data.error || 
                          (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
                          `Failed to create user (Status: ${response.status})`;
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data.data;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};

/**
 * Update an existing user
 * @param {string} userId - User ID
 * @param {Object} userData - Updated user data { name, email, password, phone, role }
 * @returns {Promise} Response data
 */
export const updateUser = async (userId, userData) => {
  try {
    // Clean data before sending
    const cleanData = {};
    if (userData.name !== undefined) cleanData.name = userData.name.trim();
    if (userData.email !== undefined) cleanData.email = userData.email.trim().toLowerCase();
    if (userData.password !== undefined && userData.password) cleanData.password = userData.password;
    if (userData.phone !== undefined) cleanData.phone = userData.phone.trim();
    if (userData.role !== undefined) cleanData.role = userData.role;
    
    console.log('Updating user with data:', { userId, ...cleanData, password: cleanData.password ? '***' : 'not provided' });
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanData),
    });
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If response is not JSON, create error with status text
      const error = new Error(`Server error: ${response.status} ${response.statusText}`);
      error.status = response.status;
      error.data = { message: `Server error: ${response.status} ${response.statusText}` };
      throw error;
    }
    
    if (!response.ok || !data.success) {
      console.error('Update user error response:', data);
      
      // Handle validation errors
      if (data.message === 'Validation error' && data.errors) {
        const error = new Error(Array.isArray(data.errors) ? data.errors.join(', ') : data.message);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      // Handle duplicate email
      if (data.message === 'User with this email already exists' || data.message?.includes('already exists')) {
        const error = new Error(data.message || 'Email already exists');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      // Handle user not found
      if (data.message === 'User not found') {
        const error = new Error(data.message || 'User not found');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      const errorMessage = data.message || 
                          data.error || 
                          (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
                          `Failed to update user (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data.data;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

/**
 * Delete a user
 * @param {string} userId - User ID
 * @returns {Promise} Response data
 */
export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      const error = new Error(data.message || 'Failed to delete user');
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
 * Get users by role
 * @param {string} roleId - Role ID (e.g., 'doctor', 'Admin', 'admin')
 * @returns {Promise} Response data
 */
export const getUsersByRole = async (roleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/role/${roleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      const errorMessage = data.message || 
                          data.error || 
                          (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
                          `Failed to fetch users by role (Status: ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Login user
 * @param {Object} credentials - Login credentials { email, password }
 * @returns {Promise} Response data with user info
 */
export const login = async (credentials) => {
  try {
    const { email, password } = credentials;
    
    if (!email || !password) {
      const error = new Error('Please provide email and password');
      error.status = 400;
      throw error;
    }
    
    const url = `${API_BASE_URL}/users/login`;
    console.log('🔍 Attempting login to:', url);
    console.log('📡 Backend URL:', API_BASE_URL);
    console.log('💡 If this fails, ensure your backend server is running separately');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password
      }),
    });
    
    // Check content type before parsing JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails even though content-type says JSON
        const text = await response.text();
        console.error('Failed to parse JSON response:', text.substring(0, 200));
        
        if (response.status === 404) {
          const error = new Error(
            `Login endpoint not found at ${url}\n\n` +
            `Please ensure:\n` +
            `1. Your backend server is running on ${API_BASE_URL.replace('/api', '')}\n` +
            `2. The route POST /api/users/login exists in your backend\n` +
            `3. The backend routes are properly configured`
          );
          error.status = 404;
          error.data = { message: 'Login endpoint not found' };
          throw error;
        }
        
        const error = new Error(`Server returned invalid JSON. Status: ${response.status}`);
        error.status = response.status;
        error.data = { message: `Server error: ${response.status} ${response.statusText}` };
        throw error;
      }
    } else {
      // Response is not JSON (likely HTML error page or plain text)
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      
      if (response.status === 404) {
        const error = new Error(
          `Login endpoint not found at ${url}\n\n` +
          `Please ensure:\n` +
          `1. Your backend server is running on ${API_BASE_URL.replace('/api', '')}\n` +
          `2. The route POST /api/users/login exists in your backend\n` +
          `3. The backend routes are properly configured`
        );
        error.status = 404;
        error.data = { message: 'Login endpoint not found' };
        throw error;
      }
      
      if (response.status >= 500) {
        const error = new Error('Server error. Please try again later or contact support.');
        error.status = response.status;
        error.data = { message: 'Server error' };
        throw error;
      }
      
      const error = new Error(`Server returned unexpected response. Status: ${response.status}`);
      error.status = response.status;
      error.data = { message: `Server error: ${response.status} ${response.statusText}` };
      throw error;
    }
    
    if (!response.ok || !data.success) {
      // Handle 404 specifically
      if (response.status === 404) {
        const error = new Error(
          `Login endpoint not found at ${url}\n\n` +
          `Please ensure:\n` +
          `1. Your backend server is running on ${API_BASE_URL.replace('/api', '')}\n` +
          `2. The route POST /api/users/login exists in your backend\n` +
          `3. The backend routes are properly configured`
        );
        error.status = 404;
        error.data = data;
        throw error;
      }
      
      const errorMessage = data.message || 
                          data.error || 
                          (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
                          'Invalid credentials';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data.data;
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error.status || error.message.includes('endpoint not found') || error.message.includes('Server error')) {
      console.error('Login error:', error);
      throw error;
    }
    
    // Check for network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      const networkError = new Error(
        `Unable to connect to the server at ${API_BASE_URL}\n\n` +
        `Please ensure:\n` +
        `1. Your backend server is running\n` +
        `2. The API URL is correct: ${API_BASE_URL}\n` +
        `3. CORS is properly configured on the backend`
      );
      networkError.status = 0;
      throw networkError;
    }
    
    console.error('Login error:', error);
    throw error;
  }
};

