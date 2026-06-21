# Employee Attendance & Field Tracking Mobile Application

An enterprise-grade, offline-first React Native application for tracking employee attendance via GPS geofencing, selfie verification, and biometric authentication.

## Core Features
- **Secure Authentication:** JWT-based logic, local SQLite session management, and `react-native-keychain` credential encryption.
- **Biometric Login:** Face ID and Fingerprint support via `react-native-biometrics`.
- **Offline-First Auto Sync:** Uses `@react-native-community/netinfo` to queue check-ins locally in SQLite when offline, automatically syncing to the REST API via a background service when the internet returns.
- **Advanced Geofencing:** Employs the Haversine formula to accurately calculate boundary distances. Restricts check-ins outside allowed office zones.
- **Selfie Verification:** Integrates `react-native-vision-camera` to strictly capture front-facing images during attendance marking.
- **Push Notifications:** Firebase Cloud Messaging (FCM) configured for server-side pushes and auto-checkout reminders.

## Tech Stack
- **Framework:** React Native (0.83.9)
- **State Management:** Zustand
- **Local Database:** SQLite (`react-native-sqlite-storage`)
- **Maps:** `react-native-maps`
- **Networking:** Axios (with mock-adapter for offline demo)

---

## Setup & Installation Instructions

### Prerequisites
- Node.js >= 20
- Ruby (for iOS Cocoapods)
- Android Studio / Xcode

### 1. Install Dependencies
```bash
# Clone the repository
git clone <repository_url>
cd EmployeeAttendanceTracker

# Install Node modules
npm install
```

### 2. Run the Application

**For Android:**
```bash
npm run android
# Or build the APK directly:
cd android && ./gradlew assembleRelease
```

**For iOS:**
```bash
cd ios
pod install
cd ..
npm run ios
```

### 3. Testing the Application
- **Registration:** Upon first launch, create a new account. Your credentials will be securely hashed in SQLite and stored in the device Keychain.
- **Biometrics:** After your first login, log out. You will now see the "Login with Biometrics" button.
- **Geofencing:** Go to "Settings" to add custom Geofence zones (e.g., set a zone exactly where you are currently standing) to test successful Check-Ins.
- **Offline Sync:** Turn off your device's Wi-Fi/Data. Perform a Check-In. The UI will succeed and save it locally. Turn Wi-Fi back on, and watch the console log as the `SyncService` automatically uploads the pending record to the API.

## Documentation
- Refer to `docs/ARCHITECTURE.md` for system design and Mermaid flowcharts.
- Refer to `docs/API_DATABASE.md` for the SQLite schema and Mock API endpoints.
