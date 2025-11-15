# Backend Refactoring Summary

## Changes Made

### 1. Clean Up & Removed Duplicates ✅

**Removed Files:**
- `backend/src/services/arduinoCloud.js` - Arduino Cloud API polling service (no longer needed)
- `backend/src/routes/webhook.js` - Duplicate webhook route (merged into iot.js)

**Removed Code:**
- Polling logic from `server.js` (setInterval, fetchGasAndMotor calls)
- Arduino Cloud API polling interval
- Legacy endpoints using Arduino API:
  - `GET /api/fans/status` - Removed (used fetchGasAndMotor)
  - `POST /api/fans/control` - Removed (used setMotorState)

**Environment Variables Removed:**
- `ARDUINO_FAN_ID`
- `ARDUINO_POLL_INTERVAL_MS`
- `ARDUINO_THING_ID`
- `ARDUINO_CLIENT_ID`
- `ARDUINO_CLIENT_SECRET`
- `ARDUINO_REFRESH_TOKEN`

### 2. Implemented Webhook Endpoint ✅

**File:** `backend/src/routes/iot.js`

**Endpoint:** `POST /api/iot/webhook`

**Features:**
- Validates payload: `device_id` (string), `values` (array)
- Extracts `gasLevel` and `motorState` from values
- Finds fan by `device_id` in `fans` table
- Uses database transactions for atomicity
- Inserts reading into `fan_readings` table
- Updates `fans` table: status, last_on_at, runtime_today, runtime_total, last_updated
- Logs to `fan_runtime_log` table
- Emits Socket.IO event `fan-update` for real-time updates
- Always returns `200 OK` (even for ignored requests) to satisfy Arduino Cloud

### 3. Fans API Enhancements ✅

**File:** `backend/src/routes/fans.js`

**GET /api/fans:**
- Lists all user's fans with latest `gas_level` from `fan_readings`
- Includes `last_updated` timestamp
- Returns: id, name, location, status, runtime_total, runtime_today, device_id, thing_id, created_at, last_updated, last_gas_level

**POST /api/fans:**
- Creates new fan with validation
- Validates `device_id` is unique per user
- Returns 409 Conflict if device_id already exists for user
- No default/dummy fan creation

### 4. Reports API ✅

**File:** `backend/src/routes/fans.js`

**GET /api/fans/report:**
- Supports `format=csv|pdf` parameter
- Supports `days=N` parameter (default 30, max 365)
- Filters fans by `last_updated` within specified days
- CSV: Uses `json2csv` library for proper formatting
- PDF: Uses `pdfkit` for PDF generation
- Includes: name, location, status, runtime_today, runtime_total, last_gas_level, created_at, last_updated

### 5. Upload & Profile APIs ✅

**File:** `backend/src/routes/upload.js`
- Saves files to `uploads/` directory
- Returns full URL using `PUBLIC_URL` or `API_BASE_URL` env variable
- Stores relative path `/uploads/filename.ext` in database

**File:** `backend/src/routes/profile.js`
- Returns full URL for profile photos
- Uses `PUBLIC_URL` env variable (falls back to `API_BASE_URL`)

### 6. Realtime Socket Setup ✅

**File:** `backend/src/server.js`

**Implementation:**
- Integrated Socket.IO with Express server
- Attached `io` instance to `app.io` for use in routes
- Webhook emits `fan-update` event on data receipt
- CORS enabled for Socket.IO connections

**Socket Event:**
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

### 7. Database Schema Updates ✅

**File:** `backend/src/services/db.js`

**Table: `fans`**
- Added `last_updated` DATETIME NULL
- Added `runtime_total` DECIMAL(10,2) DEFAULT 0
- Added unique constraint on `(user_id, device_id)`

**Table: `fan_readings`**
- Changed `timestamp` to `created_at` (standardized naming)
- Changed `motor_state` to BOOLEAN type

**Table: `fan_runtime_log`**
- Already exists with proper structure

### 8. Environment Variables ✅

**Required `.env` Variables:**
```env
PORT=5000
PUBLIC_URL=http://localhost:5000  # Or production URL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_PORT=3306
DB_NAME=smart_ventilation_system
JWT_SECRET=your-secret-key
```

**Removed (not needed):**
- `ARDUINO_*` variables
- `API_BASE_URL` (optional, falls back to PUBLIC_URL)

## File Changes Summary

### Modified Files:
1. `backend/src/server.js` - Removed polling, added Socket.IO
2. `backend/src/routes/iot.js` - Refactored webhook with transactions & sockets
3. `backend/src/routes/fans.js` - Enhanced with latest gas_level, unique device_id validation, report improvements
4. `backend/src/routes/profile.js` - Updated to use PUBLIC_URL
5. `backend/src/routes/auth.js` - Updated to use PUBLIC_URL
6. `backend/src/routes/upload.js` - Updated to use PUBLIC_URL
7. `backend/src/services/db.js` - Added schema updates
8. `backend/package.json` - Added socket.io and json2csv dependencies

### Deleted Files:
1. `backend/src/services/arduinoCloud.js`
2. `backend/src/routes/webhook.js` (duplicate)

### New Files:
1. `database/migrations/001_add_fan_schema_updates.sql`
2. `backend/README.md`
3. `backend/CHANGES_SUMMARY.md` (this file)

## Route List

### Public Routes:
- `GET /api/health` - Health check
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/iot/webhook` - Arduino Cloud webhook
- `POST /api/contact` - Contact form
- `GET /api/store` - Get products (if enabled)

### Authenticated Routes:
- `GET /api/fans` - List user's fans
- `POST /api/fans` - Create fan
- `GET /api/fans/report` - Download report
- `GET /api/profile/me` - Get profile
- `POST /api/profile/update` - Update profile
- `POST /api/uploads` - Upload file
- `GET /api/analytics` - Get analytics

### Removed Routes:
- `GET /api/fans/status` - Removed (used Arduino API)
- `POST /api/fans/control` - Removed (used Arduino API)
- `POST /api/arduino/data` - Legacy (still exists but not used by webhook)
- `POST /api/arduino/control` - Legacy (still exists but not used by webhook)

**Note:** `arduino.js` route file still exists for legacy ESP32 direct submissions but is not used by the webhook system.

## Installation & Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Create `.env` file** (see README.md for template)

3. **Run migrations:**
```bash
mysql -u root -p < database/migrations/001_add_fan_schema_updates.sql
```

4. **Create uploads directory:**
```bash
mkdir -p backend/uploads
```

5. **Start server:**
```bash
npm run dev  # Development
npm start    # Production
```

## Testing

### Test Webhook:
```bash
curl -X POST http://localhost:5000/api/iot/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test-device-123",
    "values": [
      {"name": "gasLevel", "value": 350},
      {"name": "motorState", "value": true}
    ]
  }'
```

### Test Socket.IO:
Connect frontend using Socket.IO client:
```javascript
import io from 'socket.io-client';
const socket = io('http://localhost:5000');
socket.on('fan-update', (data) => console.log(data));
```

## Next Steps

1. Configure Arduino Cloud webhook to point to `/api/iot/webhook`
2. Update frontend to connect to Socket.IO for real-time updates
3. Test webhook with real Arduino Cloud data
4. Deploy to production with proper environment variables

