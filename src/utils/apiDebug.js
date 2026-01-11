/**
 * API Debug Utility
 * Helps debug API errors by logging detailed information
 */

export const logApiError = (endpoint, error, response) => {
  console.group(`🔴 API Error: ${endpoint}`);
  console.error('Error:', error);
  if (response) {
    console.error('Response Status:', response.status);
    console.error('Response Status Text:', response.statusText);
  }
  if (error.data) {
    console.error('Error Data:', error.data);
  }
  if (error.message) {
    console.error('Error Message:', error.message);
  }
  console.groupEnd();
};

export const logApiRequest = (method, url, data = null) => {
  console.group(`📤 API Request: ${method} ${url}`);
  if (data) {
    console.log('Request Data:', data);
  }
  console.groupEnd();
};

export const logApiResponse = (url, response) => {
  console.group(`📥 API Response: ${url}`);
  console.log('Response:', response);
  console.groupEnd();
};





