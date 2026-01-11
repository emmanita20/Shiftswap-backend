# Mobile Login Error Troubleshooting Guide

## Error: "Cannot read property 'login' of undefined"

This error occurs on the **client-side (mobile app)**, not the backend. It means the mobile app is trying to call `.login()` on an object that is `undefined`.

---

## Common Causes & Solutions

### 1. **API Service Not Initialized**

**Problem:** The API service/instance is not properly imported or initialized.

**Solution:** Check your API service file (e.g., `api.js`, `authService.js`, `apiService.js`):

```javascript
// ❌ WRONG - Missing export or initialization
const api = {
  login: async (email, password) => { ... }
};
// Missing: export default api;

// ✅ CORRECT
const api = {
  login: async (email, password) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }
};

export default api; // Make sure to export!
```

**In your login component:**
```javascript
// ❌ WRONG
import api from './services/api'; // If api is undefined
api.login(...) // Error: Cannot read property 'login' of undefined

// ✅ CORRECT
import api from './services/api'; // Make sure api is exported
if (api && api.login) {
  await api.login(email, password);
}
```

---

### 2. **Incorrect Import/Export**

**Problem:** The API service is not being exported correctly.

**Check your API service file:**
```javascript
// ✅ CORRECT - Named export
export const login = async (email, password) => { ... };

// ✅ CORRECT - Default export
const authService = {
  login: async (email, password) => { ... }
};
export default authService;

// ❌ WRONG - No export
const login = async (email, password) => { ... }; // Not exported!
```

**In your component:**
```javascript
// For named export
import { login } from './services/authService';

// For default export
import authService from './services/authService';
authService.login(...);
```

---

### 3. **Base URL Not Configured**

**Problem:** The API base URL might be undefined, causing the service to fail.

**Solution:** Check your API configuration:

```javascript
// ✅ CORRECT
const BASE_URL = 'http://localhost:3000/api'; // or your server URL
// OR
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

const api = {
  login: async (email, password) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      // ...
    });
  }
};
```

---

### 4. **Network/CORS Error**

**Problem:** The request might be failing due to CORS or network issues, causing the service to be undefined.

**Solution:** 
- Check if your backend CORS is configured (it should be - we have `app.use(cors())` in server.js)
- Check network tab in browser/React Native debugger
- Verify the server is running on the correct port

**Test the endpoint directly:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"emmanita20@gmail.com","password":"yourpassword"}'
```

---

### 5. **Async/Await Issue**

**Problem:** The login function might not be properly awaited or handled.

**Solution:** Check your login handler:

```javascript
// ❌ WRONG
const handleLogin = () => {
  api.login(email, password); // Missing await, and no error handling
};

// ✅ CORRECT
const handleLogin = async () => {
  try {
    const response = await api.login(email, password);
    if (response.success) {
      // Store token
      await AsyncStorage.setItem('token', response.data.token);
      // Navigate to home
    } else {
      Alert.alert('Login Failed', response.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    Alert.alert('Login Failed', error.message || 'Cannot read property login of undefined');
  }
};
```

---

## Backend Response Structure (For Reference)

The backend returns this structure on successful login:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "staff",
      "department": "Sales"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**On error (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Recommended Mobile API Service Structure

Here's a complete example for your mobile app:

```javascript
// services/api.js
const BASE_URL = 'http://localhost:3000/api'; // Change to your server URL

const api = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      return data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  register: async (userData) => {
    // Similar structure
  },
};

export default api;
```

**In your login component:**
```javascript
import api from './services/api';

const handleLogin = async () => {
  try {
    if (!api || !api.login) {
      throw new Error('API service not initialized');
    }

    const response = await api.login(email, password);
    
    if (response.success) {
      // Store token
      await AsyncStorage.setItem('token', response.data.token);
      // Navigate
    }
  } catch (error) {
    Alert.alert('Login Failed', error.message);
  }
};
```

---

## Quick Debugging Steps

1. **Check if API service exists:**
   ```javascript
   console.log('API service:', api);
   console.log('Has login method?', api?.login);
   ```

2. **Check network request:**
   - Open React Native Debugger or browser DevTools
   - Check Network tab
   - Verify the request is being made
   - Check response status and body

3. **Test backend directly:**
   ```bash
   # Test with curl or Postman
   POST http://localhost:3000/api/auth/login
   Body: { "email": "emmanita20@gmail.com", "password": "yourpassword" }
   ```

4. **Check server logs:**
   - Is the request reaching the backend?
   - Any errors in server console?

---

## Most Likely Fix

Based on the error, the most common issue is:

**The API service object is not being exported/imported correctly.**

**Fix:**
1. Check your `api.js` or `authService.js` file
2. Make sure it has `export default api;` or `export { login };`
3. Make sure your component imports it correctly: `import api from './services/api';`
4. Add a safety check: `if (api && api.login) { ... }`

---

## Need More Help?

If the issue persists:
1. Share your mobile app's API service file
2. Share your login component code
3. Check server logs for any backend errors
4. Verify the server is running and accessible from your mobile device/emulator

