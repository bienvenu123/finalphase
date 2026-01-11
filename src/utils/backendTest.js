/**
 * Backend Connectivity Test Utility
 * Use this in browser console to test backend connectivity
 * 
 * Usage in browser console:
 *   import('./utils/backendTest').then(m => m.testBackendConnectivity())
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Test if backend server is reachable
 */
export const testBackendConnectivity = async () => {
  console.log('🔍 Testing Backend Connectivity...\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Backend Server: ${API_BASE_URL.replace('/api', '')}\n`);

  const tests = [
    {
      name: 'Backend Server (Base URL)',
      url: API_BASE_URL.replace('/api', ''),
      method: 'GET'
    },
    {
      name: 'Users Endpoint',
      url: `${API_BASE_URL}/users`,
      method: 'GET'
    },
    {
      name: 'Login Endpoint',
      url: `${API_BASE_URL}/users/login`,
      method: 'POST',
      body: { email: 'test@example.com', password: 'test123' }
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n📡 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   Method: ${test.method}`);

      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const contentType = response.headers.get('content-type');
      
      console.log(`   ✅ Status: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${contentType || 'N/A'}`);

      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await response.json();
          console.log(`   Response:`, data);
        } catch (e) {
          const text = await response.text();
          console.log(`   Response (text):`, text.substring(0, 200));
        }
      } else {
        const text = await response.text();
        console.log(`   Response (text):`, text.substring(0, 200));
      }

      if (response.status === 404) {
        console.warn(`   ⚠️  404 Not Found - Route may not exist or route order is wrong`);
      }
    } catch (error) {
      console.error(`   ❌ Error:`, error.message);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.error(`   💡 Backend server is not reachable. Is it running on port 5000?`);
      }
    }
  }

  console.log('\n\n📋 Troubleshooting Checklist:');
  console.log('1. Is your backend server running? Check: http://localhost:5000');
  console.log('2. Are user routes mounted at /api/users?');
  console.log('3. Is /login route defined BEFORE /:id route?');
  console.log('4. Is login function exported from controller?');
  console.log('5. Check browser Network tab for detailed request/response');
};

/**
 * Quick test - just check if server is reachable
 */
export const quickTest = async () => {
  try {
    const response = await fetch(API_BASE_URL.replace('/api', ''));
    console.log(`✅ Backend server is reachable (Status: ${response.status})`);
    return true;
  } catch (error) {
    console.error(`❌ Backend server is NOT reachable:`, error.message);
    console.error(`💡 Make sure your backend is running on port 5000`);
    return false;
  }
};

// Make it available globally for easy console access
if (typeof window !== 'undefined') {
  window.testBackend = testBackendConnectivity;
  window.quickTestBackend = quickTest;
  console.log('💡 Backend test utilities available:');
  console.log('   - window.testBackend() - Full connectivity test');
  console.log('   - window.quickTestBackend() - Quick server check');
}






























