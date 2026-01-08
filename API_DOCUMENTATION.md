# ShiftSwap Lite API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-token>
```

---

## Auth Endpoints

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "group one",
  "email": "group@example.com",
  "password": "password44",
  "role": "staff",
  "department": "Sales",
  "facility": "facility_id_optional"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "staff",
      "department": "Sales"
    },
    "token": "jwt_token_here"
  }
}
```

### Login
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "group@example.com",
  "password": "password123"
}
```

**Response (200):**
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
    "token": "jwt_token_here"
  }
}
```

### Logout
**POST** `/auth/logout`

Stateless logout confirmation (JWT is removed client-side).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Get Current User
**GET** `/auth/me`

Get current authenticated user information including credentials and facility.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "staff",
      "department": "Sales",
      "facility": {
        "_id": "facility_id",
        "name": "General Hospital"
      },
      "credentials": [
        {
          "credential": {
            "_id": "cred_id",
            "name": "RN",
            "description": "Registered Nurse",
            "category": "license"
          },
          "licenseNumber": "RN12345",
          "expirationDate": "2025-12-31T00:00:00.000Z",
          "isActive": true
        }
      ],
      "isActive": true
    }
  }
}
```

### Forgot Password
**POST** `/auth/forgot-password`

Request a password reset token (in production send via email; returned here for testing).

**Request Body:**
```json
{ "email": "user@example.com" }
```

**Response (200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent.",
  "data": {
    "resetToken": "token_here",     // returned for testing; remove in prod
    "resetLink": "http://localhost:3000/reset-password?token=token_here",
    "expiresIn": "1 hour"
  }
}
```

### Reset Password
**POST** `/auth/reset-password`

Reset password using a valid, unexpired reset token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password."
}
```

---

## Profile Endpoints

All profile endpoints require authentication.

### Get My Profile
**GET** `/profile`

Get the current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "staff",
      "department": "Emergency",
      "facility": "facility_id",
      "employeeId": "EMP001",
      "phoneNumber": "+1234567890",
      "preferredShiftType": "day",
      "yearsOfExperience": 5,
      "extraCertifications": "BLS, ACLS"
    }
  }
}
```

### Update My Profile
**PUT** `/profile`

Update the current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "department": "Emergency",
  "facility": "facility_id",
  "employeeId": "EMP001",
  "phoneNumber": "+1234567890",
  "preferredShiftType": "night",
  "yearsOfExperience": 6,
  "extraCertifications": "BLS, ACLS, PALS"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "profile": {...}
  }
}
```

---

## Credential Endpoints

### Get All Credentials
**GET** `/credentials`

Get all available credentials (public endpoint).

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": {
    "credentials": [
      {
        "_id": "cred_id",
        "name": "RN",
        "description": "Registered Nurse",
        "category": "license",
        "requiresExpiration": true
      }
    ]
  }
}
```

### Create Credential (Manager Only)
**POST** `/credentials`

Create a new credential type.

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Request Body:**
```json
{
  "name": "ACLS",
  "description": "Advanced Cardiac Life Support",
  "category": "certification",
  "requiresExpiration": true
}
```

### Get My Credentials
**GET** `/credentials/my-credentials`

Get current user's credentials.

**Headers:**
```
Authorization: Bearer <token>
```

### Add Credential to User
**POST** `/credentials/my-credentials`

Add a credential to the current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "credentialId": "507f1f77bcf86cd799439011",
  "licenseNumber": "RN12345",
  "issuedDate": "2020-01-15",
  "expirationDate": "2025-12-31"
}
```

### Remove User Credential
**DELETE** `/credentials/my-credentials/:credentialId`

Deactivate a credential for the current user.

**Headers:**
```
Authorization: Bearer <token>
```

---

## Facility Endpoints

### Get All Facilities
**GET** `/facilities`

Get all active facilities.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": {
    "facilities": [
      {
        "_id": "facility_id",
        "name": "General Hospital",
        "address": {
          "street": "123 Main St",
          "city": "City",
          "state": "State",
          "zipCode": "12345"
        },
        "departments": [
          {
            "name": "Emergency",
            "defaultRequiredCredentials": [
              {
                "_id": "cred_id",
                "name": "ACLS"
              }
            ],
            "defaultOvertimeThreshold": 40
          }
        ]
      }
    ]
  }
}
```

### Create Facility (Manager Only)
**POST** `/facilities`

Create a new facility.

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Request Body:**
```json
{
  "name": "General Hospital",
  "address": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "zipCode": "12345"
  },
  "departments": [
    {
      "name": "Emergency",
      "defaultRequiredCredentials": ["cred_id_1", "cred_id_2"],
      "defaultOvertimeThreshold": 40
    }
  ]
}
```

### Get Facility by ID
**GET** `/facilities/:id`

Get a specific facility.

**Headers:**
```
Authorization: Bearer <token>
```

---

## Shift Endpoints

All shift endpoints require authentication and staff/manager role.

### Create Shift
**POST** `/shifts`

Create a new shift with optional credentials, emergency flag, and incentives.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Morning Shift",
  "department": "Emergency",
  "date": "2024-01-15",
  "startTime": "09:00",
  "endTime": "17:00",
  "facility": "facility_id",
  "requiredCredentials": ["cred_id_1", "cred_id_2"],
  "isEmergency": false,
  "incentiveAmount": 50,
  "incentiveDescription": "Bonus for weekend coverage"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Shift created successfully",
  "data": {
    "shift": {
      "_id": "shift_id",
      "title": "Morning Shift",
      "department": "Emergency",
      "date": "2024-01-15T00:00:00.000Z",
      "startTime": "09:00",
      "endTime": "17:00",
      "postedBy": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "status": "open",
      "isEmergency": false,
      "incentiveAmount": 50,
      "requiredCredentials": [
        {
          "_id": "cred_id",
          "name": "RN",
          "description": "Registered Nurse"
        }
      ]
    }
  }
}
```

### Get Available Shifts
**GET** `/shifts/available?department=Emergency&emergency=true&facility=facility_id`

Get all open shifts filtered by department and credentials. Only shows shifts where user has required credentials.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `department` (optional): Filter shifts by department
- `emergency` (optional): Filter emergency shifts (`true`/`false`)
- `facility` (optional): Filter by facility ID

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": {
    "shifts": [
      {
        "_id": "shift_id",
        "title": "Morning Shift",
        "department": "Emergency",
        "date": "2024-01-15T00:00:00.000Z",
        "startTime": "09:00",
        "endTime": "17:00",
        "status": "open",
        "isEmergency": false,
        "incentiveAmount": 50,
        "requiredCredentials": [...],
        "postedBy": {...},
        "facility": {...}
      }
    ]
  }
}
```

### Get Emergency Shifts
**GET** `/shifts/emergency`

Get all emergency shifts in user's department that user qualifies for.

**Headers:**
```
Authorization: Bearer <token>
```

### Get My Shifts
**GET** `/shifts/my-shifts`

Get all shifts posted by the logged-in user.

**Headers:**
```
Authorization: Bearer <token>
```

### Get Shift by ID
**GET** `/shifts/:id`

Get a specific shift by ID with credential qualification check.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "shift": {...},
    "userQualified": true,
    "credentialCheck": {
      "isValid": true,
      "missingCredentials": [],
      "expiredCredentials": []
    }
  }
}
```

### Get My Assigned Shifts
**GET** `/shifts/my-assigned`

Get all shifts assigned to the logged-in user (their schedule).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": {
    "shifts": [
      {
        "_id": "shift_id",
        "title": "Morning Shift",
        "department": "Emergency",
        "date": "2024-01-15T00:00:00.000Z",
        "startTime": "09:00",
        "endTime": "17:00",
        "status": "assigned",
        "facility": {...},
        "requiredCredentials": [...]
      }
    ]
  }
}
```

### Update Shift
**PUT** `/shifts/:id`

Update an existing shift. Only managers or the shift owner can update.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated Morning Shift",
  "department": "Emergency",
  "date": "2024-01-15",
  "startTime": "09:00",
  "endTime": "17:00",
  "facility": "facility_id",
  "requiredCredentials": ["cred_id_1"],
  "isEmergency": false,
  "incentiveAmount": 60
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Shift updated successfully",
  "data": {
    "shift": {...}
  }
}
```

### Delete Shift
**DELETE** `/shifts/:id`

Delete a shift. Only managers can delete shifts.

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Shift deleted successfully"
}
```

---

## Shift Swap Request Endpoints

All swap request endpoints require authentication and staff/manager role.

### Create Swap Request
**POST** `/swap-requests`

Request to take an open shift. Automatically verifies credentials and checks overtime.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "shiftId": "shift_id_here"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Shift swap request created successfully",
  "data": {
    "swapRequest": {...},
    "overtimeWarning": {
      "wouldExceed": false,
      "currentHours": 35,
      "projectedHours": 43,
      "threshold": 40
    }
  }
}
```

**Error Response (403) - Missing Credentials:**
```json
{
  "success": false,
  "message": "You do not have the required credentials for this shift",
  "credentialCheck": {
    "isValid": false,
    "missingCredentials": ["cred_id"],
    "expiredCredentials": []
  }
}
```

### Get My Swap Requests
**GET** `/swap-requests/my-requests`

Get all swap requests made by the logged-in user.

**Headers:**
```
Authorization: Bearer <token>
```

### Get Swap Request by ID
**GET** `/swap-requests/:id`

Get a specific swap request by ID.

**Headers:**
```
Authorization: Bearer <token>
```

---

## Manager Endpoints

All manager endpoints require authentication and manager role.

### Get Pending Requests
**GET** `/manager/pending-requests?search=john&priority=high&type=swap`

Get all pending shift swap requests with search, filters, and summary statistics.

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Query Parameters:**
- `search` (optional): Search by employee name, department, or shift title
- `priority` (optional): Filter by priority (`high` for emergency shifts)
- `type` (optional): Filter by request type (currently only swap requests supported)

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": {
    "swapRequests": [
      {
        "_id": "request_id",
        "shift": {...},
        "requestedBy": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com",
          "department": "Nursing",
          "role": "staff"
        },
        "status": "pending",
        "overtimeWarning": {
          "wouldExceed": true,
          "currentHours": 38,
          "projectedHours": 46,
          "threshold": 40,
          "shiftHours": 8
        }
      }
    ],
    "summary": {
      "totalPending": 15,
      "highPriority": 4,
      "timeOffRequest": 2
    }
  }
}
```

### Approve Request
**POST** `/manager/approve`

Approve a shift swap request. Records work hours and creates notification.

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Request Body:**
```json
{
  "requestId": "request_id_here"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Shift swap request approved successfully",
  "data": {
    "swapRequest": {...},
    "overtimeWarning": {...}
  }
}
```

### Reject Request
**POST** `/manager/reject`

Reject a shift swap request. Sets shift back to 'open' and creates notification.

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Request Body:**
```json
{
  "requestId": "request_id_here"
}
```

---

## Staff Endpoints

All staff endpoints require authentication and manager role.

### Get All Staff
**GET** `/staff?department=Nursing&isActive=true&search=john`

Get all staff members with filtering options.

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Query Parameters:**
- `department` (optional): Filter by department
- `isActive` (optional): Filter by active status (`true`/`false`)
- `search` (optional): Search by name or email

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "data": {
    "staff": [
      {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "department": "Nursing",
        "role": "staff",
        "isActive": true,
        "facility": {...},
        "lastLogin": "2024-01-10T08:00:00.000Z"
      }
    ]
  }
}
```

### Get Staff by ID
**GET** `/staff/:id`

Get detailed information about a specific staff member.

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "staff": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "department": "Nursing",
      "role": "staff",
      "isActive": true,
      "facility": {...},
      "credentials": [...],
      "workHours": {
        "currentWeek": 32,
        "currentMonth": 128
      }
    }
  }
}
```

### Update Staff Status
**PATCH** `/staff/:id/status`

Update a staff member's status, department, or role.

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Request Body:**
```json
{
  "isActive": true,
  "department": "Emergency",
  "role": "manager"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Staff status updated successfully",
  "data": {
    "staff": {...}
  }
}
```

---

## Emergency Broadcast Endpoints

All emergency broadcast endpoints require authentication and manager role.

### Send Emergency Broadcast
**POST** `/emergency-broadcast/send`

Send an emergency broadcast message to staff, optionally filtered by department.

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Request Body:**
```json
{
  "message": "Urgent: Code Blue in ER. All available staff report immediately.",
  "department": "Emergency",
  "coverageHours": 12,
  "deliveryChannels": ["push", "email", "sms"],
  "additionalInstructions": "Bring crash cart and defibrillator."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Emergency broadcast sent successfully",
  "data": {
    "broadcast": {
      "_id": "broadcast_id",
      "message": "Urgent: Code Blue in ER...",
      "department": "Emergency",
      "coverageHours": 12,
      "sentBy": {
        "_id": "manager_id",
        "name": "Manager Name"
      },
      "sentAt": "2024-01-15T10:30:00.000Z",
      "recipientCount": 25
    }
  }
}
```

### Get Broadcast History
**GET** `/emergency-broadcast/history?department=Emergency&startDate=2024-01-01&endDate=2024-01-31`

Get history of emergency broadcasts with filtering.

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Query Parameters:**
- `department` (optional): Filter by department
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": {
    "broadcasts": [
      {
        "_id": "broadcast_id",
        "message": "Urgent: Code Blue...",
        "department": "Emergency",
        "coverageHours": 12,
        "sentBy": {...},
        "sentAt": "2024-01-15T10:30:00.000Z",
        "recipientCount": 25
      }
    ]
  }
}
```

---

## Dashboard Endpoints

All dashboard endpoints require authentication and manager role.

### Get Dashboard Summary
**GET** `/dashboard?date=2024-01-15&department=Emergency&status=open`

Get dashboard summary statistics and filtered shift list.

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Query Parameters:**
- `date` (optional): Filter shifts by specific date
- `department` (optional): Filter shifts by department
- `status` (optional): Filter shifts by status (`open`, `requested`, `approved`)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "pendingApprovals": 15,
      "todaysShifts": 8,
      "emergencyAlerts": 3
    },
    "shifts": [
      {
        "_id": "shift_id",
        "title": "Morning Shift",
        "date": "2024-01-15T00:00:00.000Z",
        "startTime": "09:00",
        "endTime": "17:00",
        "staffName": "John Doe",
        "department": "Nursing",
        "status": "approved",
        "isEmergency": false,
        "postedBy": "Manager Name"
      }
    ],
    "count": 8
  }
}
```

---

## Shift Overview Endpoints

All shift overview endpoints require authentication and manager role.

### Get Calendar View
**GET** `/shift-overview/calendar?startDate=2024-01-01&endDate=2024-01-31&department=Nursing`

Get shifts grouped by date for calendar display with coverage status.

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Query Parameters:**
- `startDate` (optional): Start date for date range (ISO format: YYYY-MM-DD)
- `endDate` (optional): End date for date range (ISO format: YYYY-MM-DD)
- `department` (optional): Filter shifts by department

**Response (200):**
```json
{
  "success": true,
  "data": {
    "calendarData": [
      {
        "date": "2024-01-15",
        "shifts": [
          {
            "_id": "shift_id",
            "title": "Morning Shift",
            "startTime": "07:00",
            "endTime": "15:00",
            "department": "Nursing",
            "coverageStatus": "Fully Covered",
            "status": "approved",
            "isEmergency": false,
            "assignedTo": "John Doe"
          },
          {
            "_id": "shift_id_2",
            "title": "Evening Shift",
            "startTime": "15:00",
            "endTime": "23:00",
            "department": "Pharmacy",
            "coverageStatus": "Partial Coverage",
            "status": "requested",
            "isEmergency": false,
            "assignedTo": null
          }
        ]
      }
    ],
    "count": 2
  }
}
```

**Coverage Status Values:**
- `Fully Covered`: Shift has assigned staff (status = 'approved' with assignedTo)
- `Partial Coverage`: Shift is requested but not yet approved (status = 'requested')
- `Understaffed`: Shift is open with no requests (status = 'open')

### Get List View
**GET** `/shift-overview/list?startDate=2024-01-01&endDate=2024-01-31&department=Nursing&status=open&coverageStatus=Understaffed`

Get shifts in list format with filtering options.

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Query Parameters:**
- `startDate` (optional): Start date for date range (ISO format: YYYY-MM-DD)
- `endDate` (optional): End date for date range (ISO format: YYYY-MM-DD)
- `department` (optional): Filter shifts by department
- `status` (optional): Filter shifts by status (`open`, `requested`, `approved`)
- `coverageStatus` (optional): Filter by coverage status (`Fully Covered`, `Partial Coverage`, `Understaffed`)

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": {
    "shifts": [
      {
        "_id": "shift_id",
        "title": "Morning Shift",
        "date": "2024-01-15T00:00:00.000Z",
        "startTime": "07:00",
        "endTime": "15:00",
        "department": "Nursing",
        "status": "approved",
        "coverageStatus": "Fully Covered",
        "assignedTo": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com",
          "department": "Nursing"
        },
        "postedBy": {
          "_id": "manager_id",
          "name": "Manager Name",
          "email": "manager@example.com"
        }
      }
    ]
  }
}
```

---

## Work Hours Endpoints

All work hours endpoints require authentication.

### Get My Work Hours
**GET** `/work-hours?weekStartDate=2024-01-15&month=1&year=2024`

Get work hours for logged-in user. Filter by week or month.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `weekStartDate` (optional): Get hours for specific week
- `month` (optional): Get hours for specific month (1-12)
- `year` (optional): Get hours for specific year

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "totalHours": 40,
  "data": {
    "workHours": [
      {
        "_id": "wh_id",
        "shift": {
          "_id": "shift_id",
          "title": "Morning Shift",
          "date": "2024-01-15",
          "startTime": "09:00",
          "endTime": "17:00"
        },
        "hoursWorked": 8,
        "date": "2024-01-15"
      }
    ]
  }
}
```

### Get Weekly Hours Summary
**GET** `/work-hours/weekly?date=2024-01-15`

Get total hours worked in a week.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "weeklyHours": 40,
    "date": "2024-01-15T00:00:00.000Z"
  }
}
```

### Get Monthly Hours Summary
**GET** `/work-hours/monthly?month=1&year=2024`

Get total hours worked in a month.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "monthlyHours": 160,
    "month": 1,
    "year": 2024
  }
}
```

### Check Overtime
**POST** `/work-hours/check-overtime`

Check if accepting a shift would cause overtime.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "date": "2024-01-15",
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "wouldExceed": true,
    "currentHours": 38,
    "projectedHours": 46,
    "threshold": 40,
    "shiftHours": 8
  }
}
```

---

## Shift History Endpoints

All history endpoints require authentication.

### Get Shift History
**GET** `/shift-history/shift/:shiftId?limit=50`

Get history for a specific shift.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": {
    "history": [
      {
        "_id": "history_id",
        "action": "approved",
        "performedBy": {
          "_id": "user_id",
          "name": "Manager Name",
          "email": "manager@example.com"
        },
        "description": "Shift swap request approved by manager",
        "createdAt": "2024-01-10T12:00:00.000Z"
      }
    ]
  }
}
```

### Get My Shift History
**GET** `/shift-history/my-history`

Get history for shifts the user is involved in (posted or assigned).

**Headers:**
```
Authorization: Bearer <token>
```

---

## Notification Endpoints

All notification endpoints require authentication.

### Get My Notifications
**GET** `/notifications?filter=unread&status=new`

Get notifications for the logged-in user with filtering options.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `filter` (optional): Filter type (`all`, `unread`, `action-required`)
  - `all`: Show all notifications (default)
  - `unread`: Show only unread notifications (status='new', isRead=false)
  - `action-required`: Show notifications that require action (requiresAction=true, not treated)
- `status` (optional): Filter by status (`new`, `read`, `treated`)

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": {
    "notifications": [
      {
        "_id": "notification_id",
        "user": "user_id",
        "message": "Your shift swap request for \"Morning Shift\" on Mon Jan 15 2024 has been approved. Note: This will result in overtime (46 hours this week).",
        "type": "approval",
        "relatedShift": {...},
        "isRead": false,
        "status": "new",
        "requiresAction": false,
        "displayStatus": "New",
        "createdAt": "2024-01-10T12:00:00.000Z"
      },
      {
        "_id": "notification_id_2",
        "user": "user_id",
        "message": "Shift swap request pending approval",
        "type": "shift_assigned",
        "relatedShift": {...},
        "isRead": true,
        "status": "read",
        "requiresAction": false,
        "displayStatus": "Read",
        "createdAt": "2024-01-09T10:00:00.000Z"
      }
    ]
  }
}
```

**Notification Status Values:**
- `new`: New notification, not yet read
- `read`: Notification has been read
- `treated`: Notification has been treated/resolved

**Display Status Values:**
- `New`: New/unread notification (status='new' or isRead=false)
- `Read`: Read notification (status='read' and isRead=true)
- `Treated`: Treated notification (status='treated')

### Get Unread Count
**GET** `/notifications/unread-count`

Get count of unread notifications.

**Headers:**
```
Authorization: Bearer <token>
```

### Mark Notification as Read
**POST** `/notifications/mark-read`

Mark a specific notification as read.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notificationId": "notification_id_here"
}
```

### Mark All Notifications as Read
**POST** `/notifications/mark-all-read`

Mark all notifications as read for the logged-in user.

**Headers:**
```
Authorization: Bearer <token>
```

### Mark Notification as Treated
**POST** `/notifications/mark-treated`

Mark a notification as treated/resolved.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notificationId": "notification_id_here"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as treated",
  "data": {
    "notification": {
      "_id": "notification_id",
      "status": "treated",
      "isRead": true,
      "requiresAction": false
    }
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [...]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required. Please provide a token."
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Server Error"
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

### Credentials & Qualifications
- Staff must have active, non-expired credentials to request shifts
- Shifts can require multiple credentials
- Credential verification is automatic when requesting shifts
- Expired credentials are flagged during verification

### Work Hours & Overtime
- Hours are automatically calculated from shift start/end times
- Weekly hours default threshold: 40 hours
- Overtime warnings are provided but don't block requests (manager decision)
- Work hours are recorded automatically when shifts are approved

### Emergency Shifts
- Emergency shifts are prioritized in listings
- Emergency shifts appear first in available shifts
- Emergency shifts require urgent attention

### Incentives
- Shifts can include incentive amounts
- Incentive descriptions are optional
- Tracked with shift assignments

### Shift History
- All shift actions are logged (created, approved, rejected, assigned, etc.)
- History includes who performed the action and when
- Useful for audit trails and compliance

### Facility & Department Setup
- Facilities can have multiple departments
- Departments can have default credential requirements
- Departments can have custom overtime thresholds
