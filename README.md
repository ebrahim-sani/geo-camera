# Geo-Camera App

A React Native Expo app that captures photos with geolocation and timestamp information.

## Features

- Camera with front/back toggle and flash
- Location acquisition with fallback to last known location
- Reverse geocoding to get human-readable addresses
- Image stamping with location and time information
- Gallery view to browse captured photos
- Metadata storage with EXIF-like JSON files
- Settings for customization

## Screens

1. **Camera Screen** - Main camera interface with capture button
2. **Gallery Screen** - Grid view of captured photos with metadata
3. **Settings Screen** - Configuration options for the app

## Technical Implementation

### Dependencies

- `expo-camera` - Camera functionality
- `expo-location` - Geolocation services
- `react-native-view-shot` - Image stamping capabilities
- `expo-media-library` - Saving photos to device gallery
- `expo-file-system` - File management
- `expo-sharing` - Sharing functionality

### Key Components

- `ImageStampOverlay` - Component for overlaying text on photos
- `StampedImageView` - View for displaying stamped images
- Image utilities for processing and saving stamped images

### Permissions

The app requests the following permissions:

- Camera - To capture photos
- Location - To add geolocation data to photos
- Media Library - To save photos to the device gallery

## Development

### Prerequisites

- Node.js
- Expo CLI
- iOS/Android simulator or device

### Installation

```bash
npm install
```

### Running the App

```bash
# Start the development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

## App Workflow

1. User opens the app and grants camera and location permissions
2. User takes a photo using the camera interface
3. App captures the photo and immediately requests location
4. Location is obtained (or falls back to last known)
5. Reverse geocoding converts coordinates to address (if available)
6. Image is stamped with location and timestamp information
7. Stamped image is saved to the device gallery
8. Metadata is saved as a JSON file
9. User can view photos in the gallery with metadata details

## File Naming Convention

Photos are saved with the format:
`YYYYMMDD_HHMMSS_Nlat_Elon.jpg`

Metadata files use the same name with a `.json` extension.

## Privacy

- Location data is only used for stamping photos
- All data is stored locally on the device
- No data is uploaded unless explicitly shared by the user