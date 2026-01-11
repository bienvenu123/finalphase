# Backend Auth Controller Fix (No JWT Required)

## Issue
Your backend login function returns:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... }
  }
}
```

But the frontend expects:
```json
{
  "success": true,
  "token": "some_token_here",
  "data": {
    "_id": "...",
    "name": "...",
    "email": "...",
    "phone": "...",
    "role": "..."
  }
}
```

## Solution: Update Your `controllers/authController.js`

Replace your `login` function with this updated version (NO JWT REQUIRED):

```javascript
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Built-in Node.js module, no installation needed
const User = require('../models/User');

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

    // Find user by email (include password field)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password matches
    let isPasswordValid = false;
    
    try {
      // Try bcrypt comparison (if password is hashed)
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (error) {
      // If bcrypt fails, try direct comparison (for unhashed passwords)
      isPasswordValid = user.password === password;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate simple token using crypto (built-in Node.js module)
    // Format: user_id + timestamp + random string, all hashed together
    const tokenData = `${user._id}_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    const token = crypto.createHash('sha256').update(tokenData).digest('hex');

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
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};
```

## Key Changes:

1. **No JWT package needed** - Uses Node.js built-in `crypto` module
2. **Simple token generation** - Creates a hash-based token from user ID, timestamp, and random bytes
3. **Correct response structure**:
   - Returns `token` field (required by frontend)
   - Returns user data directly in `data` (not nested in `user`)
4. **Error messages** - Changed to "Invalid email or password" to match frontend expectations
5. **Password field selection** - Uses `.select('+password')` to include password field for comparison

## Required Setup:

1. **No additional packages needed** - Uses only built-in Node.js modules (`crypto`)

2. **Update User Model** (if password field has `select: false`):
   Make sure your User schema allows selecting password when needed:
   ```javascript
   password: {
     type: String,
     required: true,
     select: false  // This means password won't be included by default
   }
   ```
   The `.select('+password')` in the login function will override this.

## Even Simpler Version (If You Don't Need Secure Tokens):

If you just want a basic token for testing, you can use this even simpler version:

```javascript
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (error) {
      isPasswordValid = user.password === password;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Simple token: user_id + timestamp (base64 encoded)
    const token = Buffer.from(`${user._id}_${Date.now()}`).toString('base64');

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
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};
```

## Testing

After updating, test with:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected response:
```json
{
  "success": true,
  "token": "abc123def456...",
  "data": {
    "_id": "...",
    "name": "...",
    "email": "...",
    "phone": "...",
    "role": "..."
  }
}
```

## Summary

- ✅ No JWT package installation needed
- ✅ Uses built-in Node.js `crypto` module
- ✅ Returns correct format expected by frontend
- ✅ Simple token generation without external dependencies
