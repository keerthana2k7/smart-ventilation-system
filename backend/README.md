# Smart Ventilation System - Backend

## Overview

Complete functional backend for Smart Restroom Ventilation System with webhook-based IoT integration, real-time updates via Socket.IO, and comprehensive fan management.

## Features

- ✅ Webhook-only IoT integration (no polling)
- ✅ Real-time updates via Socket.IO
- ✅ User authentication with JWT
- ✅ Fan management with device_id validation
- ✅ CSV/PDF report generation
- ✅ Profile photo uploads
- ✅ Transaction-based database operations

## Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

## Installation

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Set up environment variables:**

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=5000
PUBLIC_URL=http://localhost:5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_PORT=3306
DB_NAME=smart_ventilation_system

# JWT
JWT_SECRET=your-secret-key-change-this-in-production

# Optional: Legacy support (not needed for webhook-only)
# API_BASE_URL=http://localhost:5000
```

3. **Run database migrations:**

The database schema will be automatically created on server start. For manual migration:

```bash
mysql -u root -p < database/migrations/001_add_fan_schema_updates.sql
```

4. **Create uploads directory:**

```bash
mkdir -p backend/uploads
```

5. **Start the server:**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Routes

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Fans Management
- `GET /api/fans` - List all user's fans (requires auth)
- `POST /api/fans` - Create new fan (requires auth)
- `GET /api/fans/report?format=csv|pdf&days=N` - Download fan report (requires auth)

### IoT Webhook
- `POST /api/iot/webhook` - Arduino Cloud webhook endpoint (public)

### Profile
- `GET /api/profile/me` - Get current user profile (requires auth)
- `POST /api/profile/update` - Update user profile (requires auth)

### Uploads
- `POST /api/uploads` - Upload file (requires auth)

### Other
- `GET /api/health` - Health check
- `POST /api/contact` - Contact form submission
- `GET /api/store` - Get products (if store feature enabled)
- `GET /api/analytics` - Get analytics data (requires auth)

## Database Schema

### Tables

**users**
- id, name, email, password_hash, profile_photo, created_at

**fans**
- id, user_id, name, location, device_id (unique per user), thing_id
- status (ON/OFF), runtime_hours, runtime_today, runtime_total
- last_on_at, last_updated, created_at

**fan_readings**
- id, fan_id, gas_level, motor_state (BOOLEAN), created_at

**fan_runtime_log**
- id, fan_id, gas_level, motor_state, runtime_minutes, timestamp

## Webhook Integration

### Arduino Cloud Webhook Setup

Configure Arduino Cloud to send webhooks to:
```
POST http://your-server.com/api/iot/webhook
```

**Expected Payload:**
```json
{
  "device_id": "device-uuid",
  "thing_id": "thing-uuid",
  "values": [
    {
      "name": "gasLevel",
      "value": 400
    },
    {
      "name": "motorState",
      "value": true
    }
  ]
}
```

**Response:**
- Always returns `200 OK` (even for ignored requests)
- Returns `{ success: true }` on success

### Socket.IO Events

When webhook receives data, emits:
```javascript
io.emit('fan-update', {
  fan_id: number,
  device_id: string,
  gas_level: number,
  motor_state: boolean,
  status: 'ON' | 'OFF',
  last_updated: ISO string
});
```

**Frontend Connection:**
```javascript
import io from 'socket.io-client';
const socket = io('http://localhost:5000');

socket.on('fan-update', (data) => {
  // Update UI with real-time data
  console.log('Fan updated:', data);
});
```

## Development

### Project Structure

```
backend/
├── src/
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── fans.js          # Fan management
│   │   ├── iot.js           # Webhook handler
│   │   ├── profile.js       # User profile
│   │   ├── upload.js        # File uploads
│   │   └── ...
│   ├── services/
│   │   └── db.js            # Database connection & schema
│   ├── utils/
│   │   └── errorHandler.js  # Error handling
│   └── server.js            # Main server file
├── uploads/                 # Uploaded files directory
├── package.json
└── .env
```

### Key Changes from Previous Version

1. **Removed Polling Logic:**
   - No more `fetchGasAndMotor()` calls
   - No `setInterval` polling
   - Removed `arduinoCloud.js` service

2. **Webhook-Only IoT:**
   - Single endpoint: `POST /api/iot/webhook`
   - Transaction-based updates
   - Always returns 200 OK for Arduino Cloud

3. **Socket.IO Integration:**
   - Real-time fan updates
   - Emits events on webhook receipt

4. **Database Schema Updates:**
   - Added `last_updated` to fans
   - Added `runtime_total` to fans
   - Unique constraint on `device_id` per user

5. **Enhanced Reports:**
   - Supports `days` parameter for date filtering
   - Uses `json2csv` for CSV generation

## Testing

### Test Webhook

```bash
curl -X POST http://localhost:5000/api/iot/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test-device-123",
    "thing_id": "test-thing-456",
    "values": [
      {"name": "gasLevel", "value": 350},
      {"name": "motorState", "value": true}
    ]
  }'
```

### Test Authentication

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Production Deployment

1. Set strong `JWT_SECRET`
2. Set `PUBLIC_URL` to your production domain
3. Configure database credentials
4. Use process manager (PM2, systemd, etc.)
5. Set up reverse proxy (nginx, Apache)
6. Enable HTTPS/SSL
7. Configure firewall rules

## Troubleshooting

**Database connection errors:**
- Check DB_HOST, DB_USER, DB_PASSWORD in .env
- Ensure MySQL server is running
- Verify database exists

**Webhook not receiving data:**
- Check Arduino Cloud webhook configuration
- Verify webhook URL is accessible
- Check server logs for errors

**Socket.IO not working:**
- Ensure client connects to correct server URL
- Check CORS settings if frontend on different domain
- Verify Socket.IO server is running

## License

MIT

