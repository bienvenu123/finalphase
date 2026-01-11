# Setting Up Frontend with Separate Backend

Since your backend is in a **separate project folder**, follow these steps:

## Step 1: Start Your Backend Server

1. **Open a terminal/command prompt**
2. **Navigate to your backend project folder**:
   ```bash
   cd path/to/your/backend/project
   ```

3. **Start the backend server**:
   ```bash
   npm start
   # or
   node server.js
   # or
   nodemon server.js
   ```

4. **Verify it's running** - You should see:
   ```
   Server running on port 5000
   Connected to MongoDB
   ```

5. **Keep this terminal open** - Backend must stay running!

## Step 2: Verify Backend is Accessible

### Test 1: Check if Server is Running

Open a **new terminal** and run:

```bash
# Windows PowerShell
curl http://localhost:5000

# Windows CMD
curl http://localhost:5000

# Mac/Linux
curl http://localhost:5000
```

**Expected:**
- ✅ If running: You'll get a response (even if it's an error page)
- ❌ If not running: "Connection refused" or "Failed to connect"

### Test 2: Test Login Endpoint Directly

```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
```

**Expected Results:**
- ✅ **Route exists**: JSON response like `{"success":false,"message":"Invalid credentials"}` (even errors mean route works!)
- ❌ **Route doesn't exist**: 404 error or HTML error page

## Step 3: Start Your Frontend

1. **Open a NEW terminal/command prompt** (keep backend terminal open!)
2. **Navigate to frontend folder**:
   ```bash
   cd C:\Users\HP\Desktop\front_hospital
   ```

3. **Start frontend**:
   ```bash
   npm start
   ```

4. **Frontend will open** at `http://localhost:3000`

## Step 4: Test Connection from Frontend

### Option A: Use Browser Console

1. **Open browser** to `http://localhost:3000`
2. **Open Developer Tools** (Press F12)
3. **Go to Console tab**
4. **Run this command**:
   ```javascript
   window.testBackendConnectivity()
   ```

This will test:
- ✅ Is backend server reachable?
- ✅ Do all endpoints work?
- ✅ What's the exact error?

### Option B: Try to Login

1. Navigate to login page
2. Enter any email/password
3. Click "Sign In"
4. **Check browser console** for errors
5. **Check backend terminal** - you should see route logs if connection works

## Step 5: Fix Common Issues

### Issue: "Connection Refused" or Network Error

**Problem:** Backend server is not running or not accessible

**Solution:**
1. Go to backend terminal
2. Verify server is running (should see "Server running on port 5000")
3. If not running, start it: `npm start`
4. Test with curl (see Step 2)

### Issue: 404 Error

**Problem:** Route exists but not being found

**Solution:**
1. **Verify route order** in backend `routes/userRoutes.js`:
   ```javascript
   // ✅ CORRECT - /login BEFORE /:id
   router.post('/login', login);
   router.route('/:id').get(getUser);
   ```

2. **Restart backend server** after any route changes

3. **Add logging** to verify route is hit:
   ```javascript
   router.post('/login', (req, res, next) => {
     console.log('✅ LOGIN ROUTE HIT!');
     next();
   }, login);
   ```

4. **Check backend console** when you try to login - you should see the log

### Issue: CORS Error

**Problem:** Browser blocking request due to CORS

**Solution:**
In your backend `server.js`, ensure CORS is enabled:
```javascript
const cors = require('cors');
app.use(cors()); // You already have this
```

If still having issues, be more specific:
```javascript
app.use(cors({
  origin: 'http://localhost:3000', // Your React app
  credentials: true
}));
```

### Issue: Backend Running on Different Port

**Problem:** Backend is on port 3001, but frontend calls port 5000

**Solution:**

**Option 1:** Update backend to use port 5000:
```javascript
const PORT = process.env.PORT || 5000;
```

**Option 2:** Update frontend to match backend port:

Create `.env` file in `front_hospital` folder:
```
REACT_APP_API_URL=http://localhost:3001/api
```

Then restart frontend server.

### Issue: Password Field Not Selected

**Problem:** Login works but always says "Invalid credentials"

**Solution:**
In backend `controllers/userController.js`, update login function:
```javascript
// Change this line:
const user = await User.findOne({ email: email.toLowerCase() });

// To this:
const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
```

## Step 6: Verify Complete Setup

### Backend Checklist:
- [ ] Backend server is running
- [ ] Terminal shows "Server running on port 5000"
- [ ] MongoDB is connected
- [ ] Routes file has `/login` before `/:id`
- [ ] Login function selects password (`.select('+password')`)
- [ ] CORS is enabled
- [ ] Test with curl works

### Frontend Checklist:
- [ ] Frontend is running on `http://localhost:3000`
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows requests to `http://localhost:5000/api/users/login`
- [ ] Backend terminal shows route logs when trying to login

## Quick Diagnostic Commands

### Test Backend from Terminal:
```bash
# Test 1: Server running?
curl http://localhost:5000

# Test 2: Users endpoint?
curl http://localhost:5000/api/users

# Test 3: Login endpoint?
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
```

### Test from Browser Console:
```javascript
// Full diagnostics
window.testBackendConnectivity()

// Quick server test
window.testServer()

// Test endpoints
window.testEndpoints()
```

## Still Not Working?

1. **Check both terminals**:
   - Backend terminal: Should show server running
   - Frontend terminal: Should show React app running

2. **Check browser Network tab**:
   - Open DevTools (F12)
   - Go to Network tab
   - Try to login
   - Click on the failed request
   - Check Status, URL, and Response

3. **Check backend console**:
   - When you try to login, backend should show route logs
   - If no logs appear, route isn't being hit (check URL, CORS, server)

4. **Verify ports**:
   - Backend: Port 5000
   - Frontend: Port 3000
   - No conflicts

5. **Test backend independently**:
   - Use Postman or curl
   - Don't rely on frontend for initial testing






























