# Client API Endpoints (Web & Mobile)

This document lists the **main endpoints** that your **web frontend (admin)** and **mobile app (staff)** should use.

Base URL (local development):

`http://localhost:3000/api`

---

## 1. Auth & Profile (Web + Mobile)

### Auth
- **POST** `/auth/register`
  - Register staff or manager.
  - Body: `name, email, password, role ("staff" | "manager"), department`

- **POST** `/auth/login`
  - Login with email + password.
  - Returns `user` + `token` (JWT).

- **POST** `/auth/logout`
  - Stateless logout confirmation (remove token client-side).

- **GET** `/auth/me`
  - Get current user (used to restore session on app start).

- **POST** `/auth/forgot-password`
  - Request a reset token (returned for testing; email in production).
  - Body: `{ "email": "user@example.com" }`

- **POST** `/auth/reset-password`
  - Reset password with token.
  - Body: `{ "token": "<resetToken>", "password": "newpassword123" }`

### Profile Completion (mobile screens: Complete Your Profile step 1 & 2)

- **GET** `/profile`
  - Get full profile for currently logged-in user (includes facility, credentials, mobile fields).

- **PUT** `/profile`
  - Update any subset of profile fields (can be called once per step).
  - Example body for **Step 1 (department, role, facility, employee ID)**:
    ```json
    {
      "department": "Emergency",
      "role": "staff",
      "facility": "facility_id_here",
      "employeeId": "EMP123456"
    }
    ```
  - Example body for **Step 2 (phone, preferences, experience, certificates note)**:
    ```json
    {
      "phoneNumber": "+2348123456789",
      "preferredShiftType": "Day",
      "yearsOfExperience": 5,
      "extraCertifications": "RN, RM, BLS"
    }
    ```

---

## 1.5 Credentials Management (Mobile + Admin)

### For Profile Completion & Staff Directory

- **GET** `/credentials`
  - List all credential types (for dropdowns in profile setup).

- **GET** `/credentials/my-credentials`
  - Get current user's credentials (for profile view).

- **POST** `/credentials/my-credentials`
  - Add a credential to current user.
  - Body:
    ```json
    {
      "credentialId": "507f1f77bcf86cd799439011",
      "licenseNumber": "RN12345",
      "expirationDate": "2026-12-31"
    }
    ```

- **DELETE** `/credentials/my-credentials/:credentialId`
  - Remove a credential from current user.

### Admin Only

- **POST** `/credentials`
  - Create new credential type (admin only).
  - Body:
    ```json
    {
      "name": "ACLS",
      "description": "Advanced Cardiac Life Support",
      "category": "certification",
      "requiresExpiration": true
    }
    ```

---

## 1.6 Facilities (For Dropdowns & Admin)

- **GET** `/facilities`
  - List all facilities (for profile setup dropdowns).

- **GET** `/facilities/:id`
  - Get facility details (for admin facility management).

### Admin Only

- **POST** `/facilities`
  - Create new facility.
  - Body:
    ```json
    {
      "name": "New General Hospital",
      "address": {
        "street": "123 Main St",
        "city": "City",
        "state": "State",
        "zipCode": "12345"
      },
      "departments": [
        {
          "name": "Emergency",
          "defaultRequiredCredentials": ["cred_id_1"],
          "defaultOvertimeThreshold": 40
        }
      ]
    }
    ```

---

## 2. Staff Mobile App – Home & My Schedule

### Home: Welcome card, Upcoming Shifts, Recent Activity

- **GET** `/shifts/my-assigned?view=upcoming`
  - Shifts where the logged-in **staff** is `assignedTo`.
  - Used for the **Upcoming shifts** cards and **My Schedule (Upcoming)**.

- **GET** `/shifts/my-assigned?view=past`
  - Same endpoint, but for **Past** shifts.

- **GET** `/notifications?filter=all` / `/notifications?filter=unread`
  - Use this for **Recent Activity** (swap approvals, new requests, etc.).
  - Show `message`, `createdAt`, `displayStatus` (`New`, `Read`, `Treated`).

### My Schedule screen

- **GET** `/shifts/my-assigned?view=upcoming`
  - Upcoming assigned shifts, used for list + “Request Swap” buttons.

- **GET** `/shifts/my-assigned?view=past`
  - Completed/past shifts.

> The **Calendar View** in the mobile schedule can reuse:
> - **GET** `/shift-overview/calendar` (if you want manager‑style calendar) **or**
> - Client-side calendar built from `/shifts/my-assigned`.

---

## 3. Staff Mobile App – Shift Swaps

### Find / Browse Available Swaps

- **GET** `/shifts/available?department=Emergency&emergency=false`
  - List of **open** shifts the staff qualifies for (based on credentials).
  - Use for **Available Swaps** list/cards.

### Request Shift Swap (Request Shift Swap screen)

- **POST** `/swap-requests`
  - Create a swap request for an **open** shift.
  - Body:
    ```json
    {
      "shiftId": "shift_id_here"
    }
    ```

### My Swap Requests / Details

- **GET** `/swap-requests/my-requests`
  - Used for **My Schedule** rows like “Swap Pending” and history.

- **GET** `/swap-requests/:id`
  - Detailed swap request view (for **Swap Request Details** screen).

---

## 4. Notifications (Recent Activity, Mobile + Admin)

- **GET** `/notifications?filter=all|unread|action-required&status=new|read|treated`
  - For **Recent Activity** (mobile) and Notifications screen (admin).

- **GET** `/notifications/unread-count`
  - For notification badge counts.

- **POST** `/notifications/mark-read`
  - Body: `{ "notificationId": "..." }`

- **POST** `/notifications/mark-all-read`

- **POST** `/notifications/mark-treated`
  - For “Treated” status on admin Notifications.

---

## 5. Admin Web – Dashboard & Approvals

### Manager Dashboard (cards + table)

- **GET** `/dashboard?date=2026-01-04&department=Pediatrics&status=open`
  - Returns:
    - `summary.pendingApprovals`
    - `summary.todaysShifts`
    - `summary.emergencyAlerts`
    - `shifts` list (for dashboard table).

### Pending Approvals & Swap Request Detail

- **GET** `/manager/pending-requests?search=agnes&priority=high`
  - For **Pending Approvals** list + summary cards.

- **POST** `/manager/approve`
  - Body: `{ "requestId": "<swap_request_id>" }`

- **POST** `/manager/reject`
  - Body: `{ "requestId": "<swap_request_id>" }`

---

## 6. Admin Web – Schedule / Shift Management
- **GET** `/shifts/available`
  - List available shifts for assignment.

- **GET** `/shifts/emergency`
  - List emergency shifts.

- **GET** `/shifts/my-shifts`
  - Shifts posted by the manager.
- **GET** `/shift-overview/calendar?startDate=2026-01-01&endDate=2026-01-31&department=Nursing`
  - For the **Schedule – Calendar View** (status colors: Fully Covered, Partial Coverage, Understaffed).

- **GET** `/shift-overview/list?startDate=2026-01-01&endDate=2026-01-31&department=Nursing&status=open&coverageStatus=Understaffed`
  - For the **Schedule – List View** cards.

- **POST** `/shifts`
  - Create new shift (used by admin “Create Shift”).

- **GET** `/shifts/:id`
  - Shift details (for detail drawers/modals).

- **PUT** `/shifts/:id`
  - Update a shift (manager/owner only).

- **DELETE** `/shifts/:id`
  - Delete shift (manager only, if not assigned).

---

## 7. Admin Web – Staff Directory

- **GET** `/staff?search=kemi&role=staff&department=ICU&qualifiedOnly=true`
  - Main **Staff Directory** table.

- **GET** `/staff/:id`
  - Staff detail panel.

- **PATCH** `/staff/:id/status`
  - Update `isActive`, `department`, or `role` for a staff member.

---

## 8. Admin Web – Emergency Broadcast

- **POST** `/emergency-broadcast/send`
  - For the big red **Emergency Broadcast** screen.
  - Body:
    ```json
    {
      "message": "Critical Staffing Shortage! Urgent coverage needed in ER.",
      "department": "Emergency",
      "coverageHours": 4, // 4, 8, or 12
      "deliveryChannels": ["notification"],
      "additionalInstructions": "Extra hands required ASAP"
    }
    ```

- **GET** `/emergency-broadcast/history?limit=20`
  - For viewing past broadcasts + read/unread stats.

---

## 9. Work Hours & Burnout Indicators (Mobile + Admin)

- **GET** `/work-hours?weekStartDate=2026-01-04`
  - Staff’s worked shifts + total hours (for burnout indicators).

- **GET** `/work-hours/weekly?date=2026-01-04`
- **GET** `/work-hours/monthly?month=1&year=2026`
- **POST** `/work-hours/check-overtime`
  - Body:
    ```json
    {
      "date": "2026-01-08",
      "startTime": "07:00",
      "endTime": "19:00"
    }
    ```
  - Returns whether this would cause overtime (used before approving swaps).

---

## 9.5 Shift History (Mobile + Admin)

- **GET** `/shift-history/my-history`
  - Get history of shifts the user was involved in (posted or assigned).

- **GET** `/shift-history/shift/:shiftId`
  - Get history for a specific shift (changes, assignments, etc.).

---

## 10. Facilities (for dropdowns during profile/setup)

- **GET** `/facilities`
  - List of facilities + departments for dropdowns.

- **GET** `/credentials`
  - List of credential types for staff credential management.

---

## Notes for Client Developers

- **Authentication**: All endpoints except `/auth/register` and `/auth/login` require the `Authorization: Bearer <token>` header. Store the token securely and include it in every request.
- **Roles & Permissions**:
  - **Mobile App**: Typically for `role = "staff"`. Some endpoints (like creating shifts) are manager-only.
  - **Admin Web**: For `role = "manager"`. Full access to management endpoints.
- **Dates**: Send dates in ISO format (`YYYY-MM-DD` or full ISO with time).
- **Error Handling**: All endpoints return a consistent error format:
  ```json
  {
    "success": false,
    "message": "Error description"
  }
  ```
- **Success Responses**: All successful responses include `"success": true` and data in a `data` object.
- **File Uploads**: Not currently supported; all data is JSON.
- **Rate Limiting**: Not implemented yet; avoid excessive requests.
- **WebSockets**: Not used; use polling for real-time updates if needed.


