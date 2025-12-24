# Linkzly React Native SDK - Example App

A comprehensive example demonstrating the integration and usage of the `@linkzly/react-native-sdk` package.

## Features Demonstrated

- ✅ SDK initialization and configuration
- ✅ Automatic deep link handling
- ✅ Deep link listeners and navigation
- ✅ Event tracking (install, open, custom events)
- ✅ User identification
- ✅ Privacy controls
- ✅ ATT permission handling (iOS)
- ✅ Advertising identifier collection

## Getting Started

### Prerequisites

- Node.js 18+
- React Native development environment
- Xcode 14+ (iOS)
- Android Studio (Android)

### Installation

```bash
# Install dependencies
npm install

# iOS - Install pods
cd ios && pod install && cd ..
```

### Running the App

```bash
# Start Metro bundler
npm start

# iOS
npm run ios

# Android
npm run android
```

## Testing Deep Links

### iOS Simulator

```bash
# Universal Link
xcrun simctl openurl booted "https://yourdomain.link/products?product_id=123"

# Custom URL Scheme
xcrun simctl openurl booted "linkzlyexample://products?product_id=123"
```

### Android Emulator

```bash
adb shell am start -a android.intent.action.VIEW \
  -d "https://yourdomain.link/products?product_id=123" \
  com.linkzlyexample
```

## Project Structure

```
example/
├── App.tsx                 # Main app with SDK initialization
├── src/
│   ├── navigation/
│   │   ├── AppNavigator.tsx    # Navigation setup
│   │   └── DeepLinkRouter.ts   # Deep link routing logic
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── ProductListScreen.tsx
│   │   ├── ProductDetailScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── models/
│   │   └── Product.ts
│   └── services/
│       └── ProductService.ts
└── ios/                    # iOS native project
└── android/                # Android native project
```

## SDK Usage Examples

### Initialize SDK

```typescript
import LinkzlySDK, { Environment } from '@linkzly/react-native-sdk';

await LinkzlySDK.configure(
  'YOUR_SDK_KEY',
  Environment.PRODUCTION
);
```

### Handle Deep Links

```typescript
const unsubscribe = LinkzlySDK.addDeepLinkListener((deepLinkData) => {
  console.log('Path:', deepLinkData.path);
  console.log('Parameters:', deepLinkData.parameters);
  // Navigate based on deep link data
});
```

### Track Events

```typescript
await LinkzlySDK.trackEvent('purchase_completed', {
  product_id: '123',
  amount: 29.99
});
```

## Learn More

- [SDK Documentation](../README.md)
- [Deep Linking Guide](../DEEP_LINKING_GUIDE.md)
- [Integration Guide](../INTEGRATION_GUIDE.md)
