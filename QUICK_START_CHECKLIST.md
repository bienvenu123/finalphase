# Quick Start Checklist - Separate Backend Setup

## ⚡ Quick Steps

### 1. Start Backend Server (Terminal 1)
```bash
cd path/to/your/backend
npm start
```
✅ **Verify:** Should see "Server running on port 5000"

### 2. Test Backend (Terminal 2)
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
```
✅ **Expected:** JSON response (even if error, means route exists)

### 3. Start Frontend (Terminal 3)
```bash
cd C:\Users\HP\Desktop\front_hospital
npm start
```
✅ **Verify:** Browser opens at `http://localhost:3000`

### 4. Test Connection (Browser Console)
Press F12, then run:
```javascript
window.testBackendConnectivity()
```

## 🔍 Troubleshooting

### If Backend Test Fails:
- ❌ "Connection refused" → Backend not running
- ❌ 404 error → Route not registered (check route order)
- ✅ JSON response → Backend works! Check frontend

### If Frontend Test Fails:
- Check browser console for errors
- Check Network tab for request details
- Verify backend is still running

## 📋 Critical Checks

- [ ] Backend server running (Terminal 1)
- [ ] Backend responds to curl test
- [ ] Frontend server running (Terminal 3)
- [ ] Browser console shows no CORS errors
- [ ] Backend console shows route logs when login attempted

## 🎯 Most Common Issue

**Backend server not running!**

Make sure you have TWO terminals:
1. **Terminal 1:** Backend server (must stay running!)
2. **Terminal 2/3:** Frontend server

Both must be running simultaneously!






























