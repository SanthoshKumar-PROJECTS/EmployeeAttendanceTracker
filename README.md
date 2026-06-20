# Employee Attendance & Field Tracking App

A premium, highly-optimized React Native mobile application designed for secure employee attendance and field tracking. This application features a robust **Offline-First SQLite Database Architecture**, delivering butter-smooth 60fps performance across dynamic interfaces, maps, and camera modules.

## 🚀 Core Features

- **Secure Login & Registration**: Local account creation with encrypted `Keychain` credential storage.
- **Biometric Authentication**: One-tap Fingerprint and Face ID support.
- **Google Maps Geofencing Engine**: 
  - Dynamic `MapView` integration.
  - Custom location picker with `Google Places API` reverse-geocoding.
  - Real-time `haversine` distance calculations running offline on the device CPU.
- **Vision Camera Integration**: 
  - High-performance native `<Camera>` integration using `react-native-vision-camera` (Nitro Modules C++ Engine).
  - Front-camera selfie capture during check-in/out.
  - Images saved directly to the local filesystem (`react-native-fs`).
- **Butter-Smooth UI Architecture**: 
  - Isolated Timer components to prevent unnecessary screen renders.
  - Deeply optimized `useMemo` hooks for Map rendering and `useCallback` implementations for infinite-scrolling lists.
- **Offline-First Philosophy**: 
  - The app's core functions (Check-In, Geofence calculation, Camera capture, and Dashboard Analytics) do **not** require internet access.
  - All records and user data sync perfectly with the local SQLite database.
- **Smart Notifications**: 
  - Automatic offline daily reminder alarms triggered via `@notifee/react-native`.
  - Firebase Cloud Messaging (`FCM`) configured for remote push notifications.

---

## 🛠️ Technology Stack

- **Framework**: React Native 0.83.9 (JavaScript)
- **Local Database**: `react-native-sqlite-storage`
- **State Management**: `zustand`
- **Credential Storage**: `react-native-keychain`
- **Biometrics**: `react-native-biometrics`
- **Location Engine**: `react-native-geolocation-service`
- **Maps & Geocoding**: `react-native-maps`, `react-native-google-places-autocomplete`
- **High-Performance Camera**: `react-native-vision-camera`, `react-native-nitro-modules`
- **Filesystem**: `react-native-fs`
- **Notifications**: `@react-native-firebase/app`, `@react-native-firebase/messaging`, `@notifee/react-native`
- **Graphics & Styling**: Custom Premium Dark Theme, Vanilla CSS layout system

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```
*(Note: Ensure your environment is configured for React Native CLI, not Expo)*

### 2. Start the Metro Bundler
```bash
npm start -- --reset-cache
```

### 3. Run on Android
Open a new terminal window and run:
```bash
npm run android
```

---

## 🏗️ Local Architecture Flow

```text
Local Mobile App (100% Client-Side)
│
├── Auth Flow
│   └── Zustand Store ↔ SQLite DB + Keychain Auth Tokens + Biometrics API
│
├── Settings & Configuration Flow
│   └── SQLite DB (Geofence Configs) ↔ Google Places API (Location Picker)
│
├── Attendance Flow (Check In/Out)
│   ├── Location Service (GPS Lat/Lng)
│   ├── Geofence Validator (Haversine CPU calc against DB zones)
│   ├── Camera Service (Native Vision Camera → Base64 / Local Filesystem)
│   └── SQLite DB (Insert Attendance Record)
│
├── Dashboard & History Flow
│   ├── Zustand Store (Memory Cache) ↔ SQLite DB (Query Rows)
│   └── FlatList Engine (Render optimized historical tiles + Mini-Maps)
│
└── Notification Flow
    └── Firebase Messaging (Remote FCM) + Notifee (Local Alarms)
```

## ⚡ Performance Highlights
* **ProGuard:** ProGuard has been explicitly disabled in `release` builds to ensure seamless compatibility with Google Firebase reflection dependencies. 
* **React Native Memory:** `LiveTimer` components are strictly isolated, and heavy UI nodes (`MapView`, `Camera`) are memoized to guarantee smooth navigation transitions and strict 60fps scrolling.
