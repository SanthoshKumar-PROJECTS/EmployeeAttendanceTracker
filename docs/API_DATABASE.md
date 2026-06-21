# Database & API Documentation

## 1. Local SQLite Database Schema

The app uses `react-native-sqlite-storage` for highly optimized, offline-first data persistence.

### Table: `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID |
| `email` | TEXT | UNIQUE | User email address |
| `password` | TEXT | NOT NULL | Bcrypt-simulated hash |
| `fullName` | TEXT | NOT NULL | User's full name |
| `department` | TEXT | | E.g., Engineering |
| `phone` | TEXT | | Phone Number |
| `avatarPath` | TEXT | | Local path to profile image |
| `fcmToken` | TEXT | | Firebase Push Notification Token |
| `createdAt` | TEXT | NOT NULL | ISO Timestamp |
| `updatedAt` | TEXT | NOT NULL | ISO Timestamp |

### Table: `attendance`
*Indexes: `idx_attendance_userId`, `idx_attendance_date`, `idx_attendance_userId_date`, `idx_attendance_syncStatus`*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID |
| `userId` | TEXT | FOREIGN KEY | References `users.id` |
| `date` | TEXT | NOT NULL | YYYY-MM-DD |
| `checkInTime` | TEXT | | ISO8601 Timestamp |
| `checkOutTime` | TEXT | | ISO8601 Timestamp |
| `checkInLat` | REAL | | Check-in Latitude |
| `checkInLng` | REAL | | Check-in Longitude |
| `checkOutLat` | REAL | | Check-out Latitude |
| `checkOutLng` | REAL | | Check-out Longitude |
| `selfiePath` | TEXT | DEFAULT '' | Local file path to captured image |
| `isWithinGeofence` | INTEGER | DEFAULT 1 | 1 = True, 0 = False |
| `geofenceZone` | TEXT | DEFAULT '' | Name of check-in geofence zone |
| `isCheckOutWithinGeofence` | INTEGER| DEFAULT 1 | 1 = True, 0 = False |
| `checkOutGeofenceZone`| TEXT | DEFAULT '' | Name of check-out geofence zone |
| `status` | TEXT | DEFAULT 'checked_in' | 'checked_in', 'checked_out', 'auto_checked_out' |
| `notes` | TEXT | DEFAULT '' | Optional user notes |
| `syncStatus` | TEXT | DEFAULT 'pending'| Used for offline-to-online sync queue |
| `createdAt` | TEXT | NOT NULL | ISO Timestamp |
| `updatedAt` | TEXT | NOT NULL | ISO Timestamp |

### Table: `geofence_zones`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID |
| `name` | TEXT | NOT NULL | E.g., "HQ Office" |
| `latitude` | REAL | NOT NULL | Center latitude |
| `longitude`| REAL | NOT NULL | Center longitude |
| `locationName`| TEXT | DEFAULT '' | Geocoded location name |
| `radiusMeters`| REAL | DEFAULT 200 | Allowed radius in meters |
| `isActive` | INTEGER | DEFAULT 1 | 1 = Active, 0 = Inactive |
| `createdAt` | TEXT | NOT NULL | ISO Timestamp |
| `updatedAt` | TEXT | NOT NULL | ISO Timestamp |

---

## 2. REST API Documentation (Mock Layer)

The application simulates a REST API using `axios-mock-adapter` to demonstrate network synchronization capabilities. All secured routes require a standard JWT `Authorization` header.

### Authentication

**`POST /v1/auth/login`**
Authenticates a user and returns a JWT token.
- **Request Body:** `{ "email": "user@example.com", "password": "password123" }`
- **Response (200):** `{ "token": "mock-jwt-token-xyz-123", "user": { ... } }`

### Attendance Synchronization

**`POST /v1/attendance/sync`**
Receives an array of offline attendance records and syncs them to the server database.
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Request Body:** `{ "records": [ { "id": "123", "checkInTime": "...", ... } ] }`
- **Response (200):** `{ "success": true, "syncedCount": 1 }`
- **Response (401):** `{ "message": "Unauthorized. Missing JWT token." }` (If no Bearer token is provided).

### Push Notifications

**`POST /v1/users/fcm-token`**
Registers the user's device for Firebase Cloud Messaging push notifications.
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Request Body:** `{ "token": "fcm_device_token_xyz" }`
- **Response (200):** `{ "success": true }`
