# Backend Login Endpoint Setup Guide

## Required Backend Endpoint

The frontend expects a login endpoint at:
```
POST /api/auth/login
```

## Expected Request Format
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

## Expected Response Format (Success - 200)
```json
{
  "success": true,
  "token": "jwt_token_here",
  "data": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "phone": "+1234567890",
    "role": "Admin" // or "doctor"
  }
}
```

## Expected Response Format (Error - 400/401)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

## Sample Backend Code (Node.js/Express)

### 1. Create Auth Controller (`controllers/authController.js`)

```javascript
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    // Return user data without password
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    res.status(200).json({
      success: true,
      token,
      data: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

module.exports = {
  login
};
```

### 2. Create Auth Routes (`routes/authRoutes.js`)

```javascript
const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

router.post('/login', login);

module.exports = router;
```

### 3. Register Routes in Main App (`server.js` or `app.js`)

```javascript
const authRoutes = require('./routes/authRoutes');

// Mount auth routes
app.use('/api/auth', authRoutes);
```

## Alternative: If Login is Under Users Endpoint

If your backend uses `/api/users/login` instead, update `src/services/authService.js`:

Change line 16 from:
```javascript
const response = await fetch(`${API_BASE_URL}/auth/login`, {
```

To:
```javascript
const response = await fetch(`${API_BASE_URL}/users/login`, {
```

## User Model Requirements

Your User model should have:
- `email` field (unique, lowercase)
- `password` field (hashed with bcrypt)
- `matchPassword(password)` method to compare passwords
- `name`, `phone`, `role` fields for user data

## Testing the Endpoint

You can test the endpoint using curl:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

