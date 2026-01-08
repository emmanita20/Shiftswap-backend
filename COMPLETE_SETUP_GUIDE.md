# Complete Setup & API Testing Guide
## Hospital Shift Management System

This is a comprehensive step-by-step guide to install, set up, and test the Hospital Shift Management System.

---

## 📋 Table of Contents

1. [Prerequisites & Installation](#1-prerequisites--installation)
2. [Step-by-Step Setup](#2-step-by-step-setup)
3. [API Documentation](#3-api-documentation)
4. [Postman Testing Guide](#4-postman-testing-guide)

---

## 1. Prerequisites & Installation

### Step 1.1: Install Node.js

1. **Download Node.js:**
   - Visit: https://nodejs.org/
   - Download the LTS (Long Term Support) version (v14 or higher)
   - Run the installer and follow the installation wizard

2. **Verify Installation:**
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers (e.g., v18.17.0 and 9.6.7)

### Step 1.2: Install MongoDB

**Option A: Local MongoDB Installation**

1. **Windows:**
   - Download from: https://www.mongodb.com/try/download/community
   - Run the installer
   - Choose "Complete" installation
   - Install MongoDB as a Windows Service (recommended)

2. **macOS:**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```

3. **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt-get update
   sudo apt-get install -y mongodb
   ```

**Option B: MongoDB Atlas (Cloud - Recommended for Beginners)**

1. Visit: https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a free cluster
4. Get your connection string (we'll use this in Step 2.2)

### Step 1.3: Install Git (Optional)

- Download from: https://git-scm.com/downloads
- Needed if you're cloning the repository

---

## 2. Step-by-Step Setup

### Step 2.1: Navigate to Project Directory

```bash
# Open terminal/command prompt
cd "C:\Users\user A\Desktop\Group1-Captone Project"
```

### Step 2.2: Install Project Dependencies

```bash
npm install
```

This will install all required packages:
- express (web framework)
- mongoose (MongoDB driver)
- jsonwebtoken (authentication)
- bcryptjs (password hashing)
- cors (cross-origin support)
- dotenv (environment variables)
- express-validator (input validation)

### Step 2.3: Create Environment File

1. **Create a file named `.env` in the root directory**

2. **Add the following content:**

   **For Local MongoDB:**
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/shiftswap-lite
   JWT_SECRET=your-super-secret-key-change-this-in-production-12345
   NODE_ENV=development
   ```

   **For MongoDB Atlas (Cloud):**
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/shiftswap-lite?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-key-change-this-in-production-12345
   NODE_ENV=development
   ```
   *(Replace username, password, and cluster URL with your Atlas credentials)*

### Step 2.4: Start MongoDB (Local Installation Only)

**Windows:**
```bash
# If installed as service, MongoDB should start automatically
# If not, run:
mongod
```

**macOS/Linux:**
```bash
# Start MongoDB service
sudo systemctl start mongod
# OR
brew services start mongodb-community
```

### Step 2.5: Start the Server

```bash
# Development mode (auto-restarts on file changes)
npm run dev

# OR Production mode
npm start
```

**Expected Output:**
```
MongoDB connected successfully
Server running on port 3000
API available at http://localhost:3000/api
```

✅ **If you see this, your server is running successfully!**

---

## 3. API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Most endpoints require authentication. After logging in, you'll receive a JWT token. Include it in requests:

```
Authorization: Bearer <your-token>
```

---

## 3.1 Authentication Endpoints

### 🔐 Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Create a new user account (Doctor, Nurse, Lab Scientist, etc.)

**Request Body:**
```json
{
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@hospital.com",
  "password": "securepassword123",
  "role": "staff",
  "department": "Nursing"
}
```

**Field Descriptions:**
- `name` (required): Full name of the user
- `email` (required): Email address (must be unique)
- `password` (required): Password (minimum 6 characters)
- `role` (required): Either `"staff"` or `"manager"`
- `department` (required): Hospital department (e.g., "Nursing", "Emergency Medicine", "Laboratory")

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@hospital.com",
      "role": "staff",
      "department": "Nursing"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "User already exists with this email"
}
```

---

### 🔑 Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "email": "sarah.johnson@hospital.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@hospital.com",
      "role": "staff",
      "department": "Nursing"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### 👤 Get Current User

**Endpoint:** `GET /api/auth/me`

**Description:** Get current logged-in user's information

**Headers:**
```
Authorization: Bearer <your-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@hospital.com",
      "role": "staff",
      "department": "Nursing",
      "facility": null,
      "credentials": [],
      "isActive": true
    }
  }
}
```

---

## 3.2 Shift Endpoints

### ➕ Create Shift

**Endpoint:** `POST /api/shifts`

**Description:** Create a new shift posting

**Headers:**
```
Authorization: Bearer <your-token>
```

**Request Body:**
```json
{
  "title": "Night Shift - Emergency Department",
  "department": "Emergency Medicine",
  "date": "2024-01-15",
  "startTime": "20:00",
  "endTime": "08:00",
  "facility": "facility_id_optional",
  "requiredCredentials": ["credential_id_1", "credential_id_2"],
  "isEmergency": false,
  "incentiveAmount": 50,
  "incentiveDescription": "Night shift bonus"
}
```

**Field Descriptions:**
- `title` (required): Shift title/description
- `department` (required): Hospital department
- `date` (required): Shift date (ISO format: YYYY-MM-DD)
- `startTime` (required): Start time (HH:mm format, e.g., "20:00")
- `endTime` (required): End time (HH:mm format, e.g., "08:00")
- `facility` (optional): Facility ID
- `requiredCredentials` (optional): Array of credential IDs
- `isEmergency` (optional): Boolean, default false
- `incentiveAmount` (optional): Bonus amount in dollars
- `incentiveDescription` (optional): Description of incentive

**Success Response (201):**
```json
{
  "success": true,
  "message": "Shift created successfully",
  "data": {
    "shift": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Night Shift - Emergency Department",
      "department": "Emergency Medicine",
      "date": "2024-01-15T00:00:00.000Z",
      "startTime": "20:00",
      "endTime": "08:00",
      "status": "open",
      "isEmergency": false,
      "incentiveAmount": 50,
      "postedBy": { "name": "Dr. Sarah Johnson", "email": "sarah.johnson@hospital.com" }
    }
  }
}
```

---

### 📋 Get Available Shifts

**Endpoint:** `GET /api/shifts/available`

**Description:** Get shifts available for the current user to apply for

**Headers:**
```
Authorization: Bearer <your-token>
```

**Query Parameters (optional):**
- `department`: Filter by department
- `emergency`: Filter emergency shifts (true/false)
- `facility`: Filter by facility ID

**Example:**
```
GET /api/shifts/available?emergency=true&department=Nursing
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": {
    "shifts": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Night Shift - Emergency Department",
        "department": "Emergency Medicine",
        "date": "2024-01-15T00:00:00.000Z",
        "startTime": "20:00",
        "endTime": "08:00",
        "status": "open",
        "isEmergency": false,
        "postedBy": { "name": "Dr. Sarah Johnson" }
      }
    ]
  }
}
```

---

### 🆘 Get Emergency Shifts

**Endpoint:** `GET /api/shifts/emergency`

**Description:** Get all emergency shifts in user's department

**Headers:**
```
Authorization: Bearer <your-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 1,
  "data": {
    "shifts": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "title": "URGENT: ICU Coverage Needed",
        "department": "ICU",
        "isEmergency": true,
        "date": "2024-01-15T00:00:00.000Z",
        "startTime": "12:00",
        "endTime": "20:00"
      }
    ]
  }
}
```

---

### 📝 Get My Shifts

**Endpoint:** `GET /api/shifts/my-shifts`

**Description:** Get all shifts posted by the current user

**Headers:**
```
Authorization: Bearer <your-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": {
    "shifts": [...]
  }
}
```

---

### 🔍 Get Shift by ID

**Endpoint:** `GET /api/shifts/:id`

**Description:** Get detailed information about a specific shift

**Headers:**
```
Authorization: Bearer <your-token>
```

**Example:**
```
GET /api/shifts/507f1f77bcf86cd799439012
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "shift": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Night Shift - Emergency Department",
      "department": "Emergency Medicine",
      "date": "2024-01-15T00:00:00.000Z",
      "startTime": "20:00",
      "endTime": "08:00",
      "status": "open",
      "requiredCredentials": [...],
      "postedBy": { "name": "Dr. Sarah Johnson" }
    },
    "userQualified": true,
    "credentialCheck": {
      "isValid": true,
      "missingCredentials": [],
      "expiredCredentials": []
    }
  }
}
```

---

## 3.3 Swap Request Endpoints

### 📤 Create Swap Request

**Endpoint:** `POST /api/swap-requests`

**Description:** Request to take an available shift

**Headers:**
```
Authorization: Bearer <your-token>
```

**Request Body:**
```json
{
  "shiftId": "507f1f77bcf86cd799439012",
  "swapType": "swap",
  "preferredReplacementShifts": [],
  "reason": "Need to attend family event",
  "responseDeadline": "2026-01-10T17:00:00.000Z"
}
```

**Field Descriptions:**
- `shiftId` (required): ID of the shift to request
- `swapType` (required): Type of swap - "swap", "give_up", or "coverage"
- `preferredReplacementShifts` (optional): Array of preferred shift IDs for replacement
- `reason` (required): Reason for the swap request
- `responseDeadline` (required): ISO date string for when response is needed

**Success Response (201):**
```json
{
  "success": true,
  "message": "Shift swap request created successfully",
  "data": {
    "swapRequest": {
      "_id": "507f1f77bcf86cd799439014",
      "shift": { "title": "Night Shift - Emergency Department" },
      "requestedBy": { "name": "Dr. Michael Chen" },
      "status": "pending",
      "swapType": "swap",
      "preferredReplacementShifts": [],
      "reason": "Need to attend family event",
      "responseDeadline": "2026-01-10T17:00:00.000Z"
    },
    "overtimeWarning": null
  }
}
```

---

### 📋 Get My Swap Requests

**Endpoint:** `GET /api/swap-requests/my-requests`

**Description:** Get all swap requests made by current user

**Headers:**
```
Authorization: Bearer <your-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": {
    "swapRequests": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "shift": { "title": "Night Shift" },
        "status": "pending",
        "requestedBy": { "name": "Dr. Michael Chen" }
      }
    ]
  }
}
```

---

### 🔍 Get Swap Request by ID

**Endpoint:** `GET /api/swap-requests/:id`

**Description:** Get detailed information about a specific swap request

**Headers:**
```
Authorization: Bearer <your-token>
```

---

## 3.4 Manager Endpoints

### ✅ Approve Swap Request

**Endpoint:** `POST /api/manager/approve-request/:id`

**Description:** Approve a swap request (Manager only)

**Headers:**
```
Authorization: Bearer <manager-token>
```

**Example:**
```
POST /api/manager/approve-request/507f1f77bcf86cd799439014
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Swap request approved successfully",
  "data": {
    "swapRequest": {
      "_id": "507f1f77bcf86cd799439014",
      "status": "approved"
    },
    "shift": {
      "status": "approved",
      "assignedTo": "507f1f77bcf86cd799439015"
    }
  }
}
```

---

### ❌ Reject Swap Request

**Endpoint:** `POST /api/manager/reject-request/:id`

**Description:** Reject a swap request (Manager only)

**Headers:**
```
Authorization: Bearer <manager-token>
```

**Request Body:**
```json
{
  "reason": "Insufficient credentials"
}
```

---

### 📊 Get Pending Requests

**Endpoint:** `GET /api/manager/pending-requests`

**Description:** Get all pending swap requests (Manager only)

**Headers:**
```
Authorization: Bearer <manager-token>
```

---

## 3.5 Other Endpoints

### 🏥 Facilities
- `GET /api/facilities` - Get all facilities
- `GET /api/facilities/:id` - Get facility by ID
- `POST /api/facilities` - Create facility (Manager only)

### 🎓 Credentials
- `GET /api/credentials` - Get all credentials
- `GET /api/credentials/my-credentials` - Get my credentials
- `POST /api/credentials` - Create credential (Manager only)
- `POST /api/credentials/add-to-user` - Add credential to user

### ⏰ Work Hours
- `GET /api/work-hours/my-hours` - Get my work hours
- `GET /api/work-hours/weekly` - Get weekly hours summary
- `GET /api/work-hours/monthly` - Get monthly hours summary

### 🔔 Notifications
- `GET /api/notifications` - Get my notifications
- `POST /api/notifications/mark-read` - Mark notification as read
- `POST /api/notifications/mark-all-read` - Mark all as read

### 📜 Shift History
- `GET /api/shift-history/shift/:shiftId` - Get history for a shift
- `GET /api/shift-history/my-history` - Get my shift history

---

## 4. Postman Testing Guide

### Step 4.1: Install Postman

1. **Download Postman:**
   - Visit: https://www.postman.com/downloads/
   - Download and install the application

2. **Create Account (Optional):**
   - You can use Postman without an account, but signing up allows you to save collections

### Step 4.2: Create a New Collection

1. **Open Postman**
2. **Click "New" → "Collection"**
3. **Name it:** "Hospital Shift Management API"
4. **Click "Create"**

### Step 4.3: Set Up Environment Variables

1. **Click "Environments" in the left sidebar**
2. **Click "+" to create new environment**
3. **Name it:** "Local Development"
4. **Add variables:**
   - `base_url`: `http://localhost:3000/api`
   - `token`: (leave empty, will be set after login)
5. **Click "Save"**
6. **Select "Local Development" from the environment dropdown (top right)**

### Step 4.4: Test Authentication Endpoints

#### Test 1: Register a User

1. **In your collection, click "Add Request"**
2. **Name it:** "Register User"
3. **Set method to:** `POST`
4. **Enter URL:** `{{base_url}}/auth/register`
5. **Go to "Body" tab**
6. **Select "raw" and "JSON"**
7. **Enter JSON:**
```json
{
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@hospital.com",
  "password": "securepassword123",
  "role": "staff",
  "department": "Nursing"
}
```
8. **Click "Send"**
9. **Check Response:**
   - Status should be `201 Created`
   - Copy the `token` from response
   - Go to Environment → Set `token` variable value

#### Test 2: Login

1. **Add new request:** "Login"
2. **Method:** `POST`
3. **URL:** `{{base_url}}/auth/login`
4. **Body (JSON):**
```json
{
  "email": "sarah.johnson@hospital.com",
  "password": "securepassword123"
}
```
5. **Click "Send"**
6. **Update token in environment with the new token**

#### Test 3: Get Current User

1. **Add new request:** "Get Current User"
2. **Method:** `GET`
3. **URL:** `{{base_url}}/auth/me`
4. **Go to "Authorization" tab**
5. **Type:** `Bearer Token`
6. **Token:** `{{token}}`
7. **Click "Send"**

### Step 4.5: Test Shift Endpoints

#### Test 4: Create Shift

1. **Add new request:** "Create Shift"
2. **Method:** `POST`
3. **URL:** `{{base_url}}/shifts`
4. **Authorization:** Bearer Token `{{token}}`
5. **Body (JSON):**
```json
{
  "title": "Night Shift - Emergency Department",
  "department": "Emergency Medicine",
  "date": "2024-01-15",
  "startTime": "20:00",
  "endTime": "08:00",
  "isEmergency": false,
  "incentiveAmount": 50,
  "incentiveDescription": "Night shift bonus"
}
```
6. **Click "Send"**
7. **Copy the shift `_id` from response for next tests**

#### Test 5: Get Available Shifts

1. **Add new request:** "Get Available Shifts"
2. **Method:** `GET`
3. **URL:** `{{base_url}}/shifts/available`
4. **Authorization:** Bearer Token `{{token}}`
5. **Click "Send"**

#### Test 6: Get Emergency Shifts

1. **Add new request:** "Get Emergency Shifts"
2. **Method:** `GET`
3. **URL:** `{{base_url}}/shifts/emergency`
4. **Authorization:** Bearer Token `{{token}}`
5. **Click "Send"**

### Step 4.6: Test Swap Request Endpoints

#### Test 7: Create Swap Request

1. **Add new request:** "Create Swap Request"
2. **Method:** `POST`
3. **URL:** `{{base_url}}/swap-requests`
4. **Authorization:** Bearer Token `{{token}}`
5. **Body (JSON):**
```json
{
  "shiftId": "PASTE_SHIFT_ID_HERE"
}
```
6. **Click "Send"**

#### Test 8: Get My Swap Requests

1. **Add new request:** "Get My Swap Requests"
2. **Method:** `GET`
3. **URL:** `{{base_url}}/swap-requests/my-requests`
4. **Authorization:** Bearer Token `{{token}}`
5. **Click "Send"**

### Step 4.7: Test Manager Endpoints

**Note:** You need to register/login as a manager first.

#### Test 9: Register Manager

1. **Add new request:** "Register Manager"
2. **Method:** `POST`
3. **URL:** `{{base_url}}/auth/register`
4. **Body (JSON):**
```json
{
  "name": "Dr. Emily Martinez",
  "email": "emily.martinez@hospital.com",
  "password": "securepassword123",
  "role": "manager",
  "department": "Nursing"
}
```
5. **Click "Send"**
6. **Login as manager and update token**

#### Test 10: Get Pending Requests

1. **Add new request:** "Get Pending Requests"
2. **Method:** `GET`
3. **URL:** `{{base_url}}/manager/pending-requests`
4. **Authorization:** Bearer Token `{{token}}` (manager token)
5. **Click "Send"**

#### Test 11: Approve Request

1. **Add new request:** "Approve Swap Request"
2. **Method:** `POST`
3. **URL:** `{{base_url}}/manager/approve-request/PASTE_REQUEST_ID_HERE`
4. **Authorization:** Bearer Token `{{token}}` (manager token)
5. **Click "Send"**

### Step 4.8: Create Postman Collection (Optional)

1. **Right-click your collection**
2. **Select "Export"**
3. **Choose "Collection v2.1"**
4. **Save the JSON file**
5. **You can import this later or share with your team**

---

## 🎯 Quick Testing Checklist

### Authentication
- [ ] Register a staff user
- [ ] Register a manager user
- [ ] Login as staff
- [ ] Login as manager
- [ ] Get current user info

### Shifts
- [ ] Create a shift
- [ ] Get available shifts
- [ ] Get emergency shifts
- [ ] Get my shifts
- [ ] Get shift by ID

### Swap Requests
- [ ] Create swap request
- [ ] Get my swap requests
- [ ] Get swap request by ID

### Manager Actions
- [ ] Get pending requests
- [ ] Approve swap request
- [ ] Reject swap request

---

## 🐛 Troubleshooting

### Problem: "MongoDB connection error"
**Solution:**
- Make sure MongoDB is running
- Check MONGODB_URI in `.env` file
- For Atlas: Check network access and credentials

### Problem: "Port 3000 already in use"
**Solution:**
- Change PORT in `.env` file to another port (e.g., 3001)
- Or stop the process using port 3000

### Problem: "Invalid token" or "Authentication required"
**Solution:**
- Make sure you're including the token in Authorization header
- Format: `Bearer <token>` (with space after Bearer)
- Token expires after 7 days - login again to get new token

### Problem: "Validation failed"
**Solution:**
- Check that all required fields are included
- Check data types (email must be valid email, date must be ISO format)
- Check field names match exactly (case-sensitive)

---

## 📚 Additional Resources

- **Express.js Docs:** https://expressjs.com/
- **MongoDB Docs:** https://docs.mongodb.com/
- **Postman Learning Center:** https://learning.postman.com/
- **JWT.io:** https://jwt.io/ (to decode/verify tokens)

---

## ✅ Success Indicators

You've successfully set up the system when:
1. ✅ Server starts without errors
2. ✅ MongoDB connection successful
3. ✅ Can register a user
4. ✅ Can login and get token
5. ✅ Can create a shift
6. ✅ Can create swap request
7. ✅ Manager can approve requests

---

**Happy Testing! 🎉**

If you encounter any issues, check the server console for error messages and refer to the troubleshooting section above.

