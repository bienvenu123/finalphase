/**
 * Backend Diagnostics Utility
 * Comprehensive testing and diagnostics for backend connectivity
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SERVER_BASE = API_BASE_URL.replace('/api', '');

/**
 * Test if backend server is reachable
 */
export const testServerReachability = async () => {
  console.log('🔍 Testing Backend Server Reachability...\n');
  console.log(`Server URL: ${SERVER_BASE}`);
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  try {
    const response = await fetch(SERVER_BASE, {
      method: 'GET',
      mode: 'no-cors' // Use no-cors to avoid CORS errors for basic connectivity test
    });
    console.log('✅ Server is reachable');
    return true;
  } catch (error) {
    console.error('❌ Server is NOT reachable');
    console.error('Error:', error.message);
    console.error('\n💡 Possible issues:');
    console.error('1. Backend server is not running');
    console.error('2. Server is running on a different port');
    console.error('3. Firewall or network issues');
    return false;
  }
};

/**
 * Test all user-related endpoints
 */
export const testUserEndpoints = async () => {
  console.log('\n🔍 Testing User Endpoints...\n');

  const endpoints = [
    {
      name: 'GET /api/users',
      method: 'GET',
      url: `${API_BASE_URL}/users`,
      expectedStatus: [200, 500] // 200 for success, 500 for server error (but route exists)
    },
    {
      name: 'POST /api/users/login',
      method: 'POST',
      url: `${API_BASE_URL}/users/login`,
      body: { email: 'test@example.com', password: 'test123' },
      expectedStatus: [200, 400, 401, 500] // Any of these means route exists
    },
    {
      name: 'GET /api/users/role/doctor',
      method: 'GET',
      url: `${API_BASE_URL}/users/role/doctor`,
      expectedStatus: [200, 400, 500]
    }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint.name}`);
      console.log(`  URL: ${endpoint.url}`);

      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }

      const startTime = Date.now();
      const response = await fetch(endpoint.url, options);
      const duration = Date.now() - startTime;

      const contentType = response.headers.get('content-type');
      let responseData;

      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch (e) {
          responseData = { error: 'Failed to parse JSON' };
        }
      } else {
        const text = await response.text();
        responseData = { rawResponse: text.substring(0, 200) };
      }

      const statusMatch = endpoint.expectedStatus.includes(response.status);
      const is404 = response.status === 404;

      const result = {
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        exists: !is404,
        expected: statusMatch,
        response: responseData
      };

      if (is404) {
        console.error(`  ❌ 404 Not Found - Route does not exist`);
      } else if (statusMatch) {
        console.log(`  ✅ Route exists (Status: ${response.status})`);
      } else {
        console.warn(`  ⚠️  Route exists but unexpected status: ${response.status}`);
      }

      results.push(result);
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        error: error.message,
        exists: false
      });
    }
    console.log('');
  }

  return results;
};

/**
 * Comprehensive backend diagnostics
 */
export const runFullDiagnostics = async () => {
  console.log('═══════════════════════════════════════');
  console.log('   BACKEND CONNECTIVITY DIAGNOSTICS');
  console.log('═══════════════════════════════════════\n');

  // Test 1: Server reachability
  const serverReachable = await testServerReachability();

  if (!serverReachable) {
    console.log('\n❌ Cannot proceed with endpoint tests - server is not reachable');
    console.log('\n📋 Action Items:');
    console.log('1. Start your backend server');
    console.log(`2. Verify it's running on ${SERVER_BASE}`);
    console.log('3. Check for any startup errors');
    return;
  }

  // Test 2: Endpoint tests
  const endpointResults = await testUserEndpoints();

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('   DIAGNOSTIC SUMMARY');
  console.log('═══════════════════════════════════════\n');

  const loginEndpoint = endpointResults.find(r => r.name === 'POST /api/users/login');
  
  if (loginEndpoint) {
    if (loginEndpoint.exists === false || loginEndpoint.status === 404) {
      console.log('❌ LOGIN ENDPOINT NOT FOUND (404)\n');
      console.log('🔧 Troubleshooting Steps:\n');
      console.log('1. Verify route is defined in routes/userRoutes.js:');
      console.log('   router.route(\'/login\').post(login);\n');
      console.log('2. Verify route order (CRITICAL):');
      console.log('   ✅ router.route(\'/login\').post(login);  // Must come FIRST');
      console.log('   ✅ router.route(\'/:id\').get(getUser);    // Must come AFTER\n');
      console.log('3. Verify routes are mounted in server.js:');
      console.log('   app.use(\'/api/users\', require(\'./routes/userRoutes\'));\n');
      console.log('4. Verify login function is exported from controller:');
      console.log('   module.exports = { ..., login };\n');
      console.log('5. RESTART your backend server after making changes\n');
      console.log('6. Check backend console for any errors\n');
    } else {
      console.log('✅ LOGIN ENDPOINT EXISTS\n');
      console.log(`   Status: ${loginEndpoint.status}`);
      console.log(`   Response Time: ${loginEndpoint.duration}\n`);
      
      if (loginEndpoint.status === 401) {
        console.log('💡 Endpoint works! Invalid credentials error is expected.');
      } else if (loginEndpoint.status === 400) {
        console.log('💡 Endpoint works! Validation error is expected.');
      }
    }
  }

  // Check other endpoints
  const usersEndpoint = endpointResults.find(r => r.name === 'GET /api/users');
  if (usersEndpoint && usersEndpoint.exists) {
    console.log('✅ Users endpoint is working\n');
  } else {
    console.log('⚠️  Users endpoint may have issues\n');
  }

  console.log('📊 Full Results:');
  endpointResults.forEach(result => {
    const icon = result.exists ? '✅' : '❌';
    console.log(`   ${icon} ${result.name} - Status: ${result.status || 'Error'}`);
  });

  return {
    serverReachable,
    endpointResults
  };
};

// Make available globally for console access
if (typeof window !== 'undefined') {
  window.testBackendConnectivity = runFullDiagnostics;
  window.testServer = testServerReachability;
  window.testEndpoints = testUserEndpoints;
  
  console.log('\n💡 Backend diagnostic utilities loaded:');
  console.log('   - window.testBackendConnectivity() - Full diagnostics');
  console.log('   - window.testServer() - Test server reachability');
  console.log('   - window.testEndpoints() - Test all endpoints\n');
}






























