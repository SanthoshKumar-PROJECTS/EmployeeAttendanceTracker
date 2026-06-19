# Employee Attendance & Field Tracking Mobile Application

A premium React Native mobile application designed for secure employee attendance and field tracking. This application operates entirely on the client-side, using local SQLite storage and Keychain services without requiring a backend server. Firebase is used exclusively for push notifications.

## Features

- **Secure Login & Registration**: Local account creation with secure Keychain credential storage.
- **Biometric Authentication**: Fingerprint and Face ID support for quick, secure login.
- **GPS-based Check-In & Check-Out**: Real-time location capture during attendance marking.
- **On-Device Geofencing**: Automatically validates location against pre-defined coordinates and triggers warnings if marking outside allowed areas.
- **Camera Integration**: Front-camera selfie capture during check-in/out, saved securely to local storage.
- **Dashboard Analytics**: Shows attendance stats, streaks, weekly attendance overview, and graphical work-hours trends.
- **Attendance History**: Browse and filter past attendance logs, complete with captured selfies and GPS map coordinates.
- **Offline Functionality**: Inherently offline-first. All data syncs locally with SQLite.
- **Push & Local Notifications**: Uses Firebase Cloud Messaging (FCM) for push notifications and Notifee for local reminders.
- **Data Export**: Generates local JSON reports of attendance logs for easy sharing.

## Tech Stack

- **Framework**: React Native 0.83.9 (JavaScript)
- **Local Storage**: `react-native-sqlite-storage` (SQLite)
- **Credential Storage**: `react-native-keychain`
- **Biometrics**: `react-native-biometrics`
- **Location**: `react-native-geolocation-service`
- **State Management**: Zustand
- **Graphics & Styling**: Custom Premium Dark Theme, Vanilla CSS layout system, `react-native-chart-kit`
- **Notifications**: `@react-native-firebase/app`, `@react-native-firebase/messaging`, `@notifee/react-native`
- **Camera/Sharing**: `react-native-image-picker`, `@bam.tech/react-native-image-resizer`, `react-native-share`

## Getting Started

### Step 1: Install Dependencies

Make sure your node modules are clean and installed:
```bash
npm install
```

*Note: `react-native-mmkv` has been removed to resolve compile-time dependencies related to `:react-native-nitro-modules`.*

### Step 2: Run the Development Server

Start the Metro Bundler:
```bash
npm start -- --reset-cache
```

### Step 3: Run on Android

Open a new terminal window and run:
```bash
npm run android
```
Alternatively, run the app directly through Android Studio or via Gradle command:
```bash
cd android
.\gradlew.bat app:installDebug
```

---

## Local Architecture Diagram

```
Local Mobile App (100% Client-Side)
├── Auth Service         → Local SQLite DB + Keychain Auth Tokens
├── Geofencing           → Haversine distance validation against database zones
├── Camera Service       → Native Camera UI (Selfie Capture) → Base64 / Local Filesystem
├── Notifications        → Firebase Messaging (FCM API) + local Notifee alerts
└── Export Service       → JSON file generation + Native Share API
```
