# Backend Connection Guide

Since your backend is in a **separate project**, follow these steps to ensure proper connection:

## Step 1: Verify Backend is Running

### Check if Backend Server is Running

1. **Navigate to your backend project folder**
2. **Start your backend server**:
   ```bash
   cd path/to/your/backend
   npm start
   # or
   node server.js
   # or
   nodemon server.js
   ```

3. **Verify server started** - You should see:
   ```
   Server running on port 5000
   Connected to MongoDB...
   ```

### Test Backend Directly

Open a new terminal and test:

```bash
# Test 1: Check if server is running
curl http://localhost:5000

# Test 2: Test users endpoint
curl http://localhost:5000/api/users

# Test 3: Test login endpoint
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
```

**Expected Results:**
- ✅ If server is running: You'll get JSON responses (even if errors)
- ❌ If server is NOT running: "Connection refused" or "Failed to connect"

## Step 2: Verify Backend Routes

### Add Temporary Logging to Backend

In your backend `routes/userRoutes.js`, add logging:

```javascript
const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  login
} = require('../controllers/userController');

// Add logging middleware
router.use((req, res, next) => {
  console.log(`[USER ROUTES] ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Routes
router.route('/')
  .get(getUsers)
  .post(createUser);

// Login route with logging
router.post('/login', (req, res, next) => {
  console.log('✅ LOGIN ROUTE HIT!');
  console.log('Request body:', req.body);
  next();
}, login);

router.route('/role/:roleId')
  .get(getUsersByRole);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
```

### Restart Backend Server

After adding logging, **restart your backend server**.

## Step 3: Test from Frontend

### Option A: Use Browser Console Test

1. **Start your frontend** (if not already running):
   ```bash
   cd front_hospital
   npm start
   ```

2. **Open browser** to `http://localhost:3000`
3. **Open browser console** (F12)
4. **Run diagnostic**:
   ```javascript
   window.testBackendConnectivity()
   ```

This will test:
- ✅ Server connectivity
- ✅ All endpoints
- ✅ Show detailed results

### Option B: Test Login Page

1. Navigate to login page
2. Try to login
3. **Check backend console** - you should see:
   ```
   [USER ROUTES] POST /api/users/login - 2024-...
   ✅ LOGIN ROUTE HIT!
   Request body: { email: '...', password: '...' }
   ```

## Step 4: Common Issues and Solutions

### Issue 1: Backend Server Not Running

**Symptoms:**
- Frontend shows "Connection refused" or network error
- curl test fails

**Solution:**
1. Navigate to backend folder
2. Start backend server
3. Verify it's running on port 5000

### Issue 2: Backend Running on Different Port

**Symptoms:**
- Frontend calls `localhost:5000` but backend is on `localhost:3001`

**Solution:**
Update frontend `.env` file or `userService.js`:
```javascript
// In src/services/userService.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
```

Or create `.env` file in frontend root:
```
REACT_APP_API_URL=http://localhost:3001/api
```

### Issue 3: CORS Errors

**Symptoms:**
- Browser console shows CORS error
- Network tab shows "CORS policy" error

**Solution:**
Ensure backend has CORS enabled (you already have this):
```javascript
app.use(cors());
```

If still having issues, be more specific:
```javascript
app.use(cors({
  origin: 'http://localhost:3000', // Your React app URL
  credentials: true
}));
```

### Issue 4: Route Not Found (404)

**Symptoms:**
- Backend server is running
- Other endpoints work
- Login endpoint returns 404

**Solution:**
1. **Verify route order** in `userRoutes.js`:
   ```javascript
   // ✅ CORRECT ORDER
   router.post('/login', login);      // BEFORE /:id
   router.route('/:id').get(getUser);  // AFTER /login
   ```

2. **Verify routes are mounted** in `server.js`:
   ```javascript
   app.use('/api/users', require('./routes/userRoutes'));
   ```

3. **Restart backend server** after any changes

### Issue 5: Password Field Not Selected

**Symptoms:**
- Login route works but password comparison fails
- "Invalid credentials" even with correct password

**Solution:**
Update login controller to select password:
```javascript
// In controllers/userController.js - login function
const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
```

## Step 5: Verify Complete Setup

### Backend Checklist:
- [ ] Backend server is running
- [ ] Server shows "Server running on port 5000"
- [ ] MongoDB is connected
- [ ] Routes are properly ordered (`/login` before `/:id`)
- [ ] CORS is enabled
- [ ] Login function selects password field (`.select('+password')`)

### Frontend Checklist:
- [ ] Frontend is running on `http://localhost:3000`
- [ ] API_BASE_URL is `http://localhost:5000/api`
- [ ] No CORS errors in browser console
- [ ] Network tab shows requests going to correct URL

## Step 6: Debugging Steps

### 1. Check Backend Console

When you try to login from frontend, check backend console:
- ✅ If you see route logs: Route is working, check controller logic
- ❌ If you don't see logs: Route isn't being hit (check URL, CORS, server)

### 2. Check Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try to login
4. Click on the login request
5. Check:
   - **Request URL**: Should be `http://localhost:5000/api/users/login`
   - **Request Method**: Should be `POST`
   - **Status Code**: 
     - 200/400/401 = Route exists ✅
     - 404 = Route not found ❌
     - CORS error = CORS issue ⚠️

### 3. Test with Postman

Test backend directly (bypasses frontend):

1. Open Postman
2. Create new POST request
3. URL: `http://localhost:5000/api/users/login`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
   ```json
   {
     "email": "test@example.com",
     "password": "test123"
   }
   ```
6. Send request

**Expected:**
- ✅ Route exists: JSON response (even if invalid credentials)
- ❌ Route doesn't exist: 404 error

## Quick Test Script

Create `test-backend-connection.js` in your backend folder:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Test route
app.post('/api/users/login', (req, res) => {
  console.log('✅ Login endpoint hit!');
  console.log('Body:', req.body);
  res.json({ success: true, message: 'Route works!' });
});

app.listen(5000, () => {
  console.log('Test server running on port 5000');
  console.log('Try: curl -X POST http://localhost:5000/api/users/login -H "Content-Type: application/json" -d \'{"email":"test","password":"test"}\'');
});
```

Run it: `node test-backend-connection.js`

If this works, your backend server setup is fine. If not, there's a server configuration issue.

## Still Having Issues?

1. **Verify both servers are running**:
   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:3000`

2. **Check for port conflicts**:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Mac/Linux
   lsof -i :5000
   ```

3. **Test backend independently**:
   - Use curl or Postman
   - Don't rely on frontend for initial testing

4. **Check backend logs**:
   - Look for any errors during startup
   - Check if routes are being registered

5. **Verify file paths**:
   - Ensure `require('./routes/userRoutes')` path is correct
   - Check for typos in file names






























