# ShiftSwap Lite - Hospital Shift Management System

**A comprehensive shift management system designed for hospital personnel including Doctors, Nurses, Lab Scientists, and other healthcare staff.**

This system enables hospital staff to manage shift schedules, request shift swaps, verify credentials/licenses, track work hours, and handle emergency shift coverage.

> 📖 **For a complete step-by-step guide with Postman testing instructions, see [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)**

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/shiftswap-lite
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

3. Start MongoDB (if using local MongoDB):
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

4. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3000`

## Project Structure

```
shiftswap-lite/
├── controllers/          # Request handlers
│   ├── authController.js
│   ├── shiftController.js
│   ├── swapRequestController.js
│   ├── managerController.js
│   └── notificationController.js
├── models/              # MongoDB Mongoose schemas
│   ├── User.js
│   ├── Shift.js
│   ├── ShiftSwapRequest.js
│   └── Notification.js
├── routes/              # API routes
│   ├── auth.js
│   ├── shifts.js
│   ├── swapRequests.js
│   ├── manager.js
│   └── notifications.js
├── middleware/          # Custom middleware
│   ├── auth.js
│   ├── errorHandler.js
│   └── validation.js
├── server.js            # Entry point
├── package.json
├── .gitignore
├── API_DOCUMENTATION.md
└── SETUP.md
```

## Testing the API

You can use tools like Postman, Insomnia, or curl to test the API endpoints. See `API_DOCUMENTATION.md` for detailed endpoint documentation.

### Quick Test Example (Hospital Personnel)

1. Register a hospital staff member (e.g., Nurse, Doctor, Lab Scientist):
```bash
# Register a Nurse
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@hospital.com",
    "password": "securepassword123",
    "role": "staff",
    "department": "Nursing"
  }'

# Register a Doctor
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Michael Chen",
    "email": "michael.chen@hospital.com",
    "password": "securepassword123",
    "role": "staff",
    "department": "Emergency Medicine"
  }'

# Register a Lab Scientist
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "James Wilson",
    "email": "james.wilson@hospital.com",
    "password": "securepassword123",
    "role": "staff",
    "department": "Laboratory"
  }'

# Register a Manager (Department Head, HR, etc.)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Emily Martinez",
    "email": "emily.martinez@hospital.com",
    "password": "securepassword123",
    "role": "manager",
    "department": "Nursing"
  }'
```

2. Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.johnson@hospital.com",
    "password": "securepassword123"
  }'
```

3. Use the returned token in subsequent requests:
```bash
curl -X GET http://localhost:3000/api/shifts/available \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Hospital Department Examples

Common hospital departments that can be used:
- **Nursing** - Registered Nurses (RN), Licensed Practical Nurses (LPN), Nurse Practitioners
- **Emergency Medicine** - Emergency Department doctors and staff
- **Laboratory** - Lab Scientists, Medical Technologists, Lab Technicians
- **Radiology** - Radiologists, Radiology Technicians
- **Surgery** - Surgeons, Surgical Technicians, OR Nurses
- **ICU** - Intensive Care Unit staff
- **Cardiology** - Cardiologists, Cardiac Nurses
- **Pediatrics** - Pediatricians, Pediatric Nurses
- **Pharmacy** - Pharmacists, Pharmacy Technicians
- **Administration** - Hospital administrators, HR staff

## Environment Variables

- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing (change in production!)
- `NODE_ENV` - Environment (development/production)

## Notes

- Make sure MongoDB is running before starting the server
- Change `JWT_SECRET` to a strong random string in production
- All passwords are hashed using bcrypt before storage
- JWT tokens expire after 7 days

