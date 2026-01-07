# LinkzlySDK for React Native

![npm version](https://img.shields.io/npm/v/@linkzly/react-native-sdk?style=flat-square&color=0066FF)
![Platform](https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey?style=flat-square)
![React Native](https://img.shields.io/badge/React%20Native-%3E%3D%200.71-61DAFB?style=flat-square&logo=react)

LinkzlySDK is a React Native wrapper for deep linking and attribution tracking. Track app installs, opens, and custom events while seamlessly handling Universal Links (iOS) and App Links (Android) for deferred deep linking.

## Features

- 🔗 **Universal Links & App Links Support** - Handle deep links automatically
- 📊 **Attribution Tracking** - Track installs, opens, and custom events
- 🎯 **Deferred Deep Linking** - Match users to campaigns after install
- 👤 **User Identification** - Associate events with specific users
- 🔐 **Privacy-First** - Opt-in/opt-out tracking controls
- 📱 **Advertising Identifiers** - IDFA, GAID, and ATT framework support
- ⚡ **Lightweight** - Zero third-party JavaScript dependencies
- 🔧 **TypeScript** - Full type definitions included

## Requirements

| Component | Minimum Version | Recommended |
|-----------|----------------|-------------|
| React Native | 0.71.2+ | 0.73+ |
| Node.js | 16+ | 18+ |
| iOS | 12.0+ | 15.0+ |
| Xcode | 14.0+ | 15.0+ |
| Android SDK | API 21+ | API 33+ |
| Kotlin | 1.8+ | 1.9+ |

## Installation

### npm / yarn

```bash
# npm
npm install @linkzly/react-native-sdk

# yarn
yarn add @linkzly/react-native-sdk
```

### iOS Setup

1. Add LinkzlySDK to your `Podfile` (before `use_native_modules!`):

```ruby
pod 'LinkzlySDK', :git => 'https://github.com/MarenTech/linkzly-ios-sdk.git', :tag => '1.0.0'
```

2. Install CocoaPods dependencies:

```bash
cd ios && pod install && cd ..
```

### Android Setup

Add JitPack repository to root `android/build.gradle`:

```gradle
allprojects {
    repositories {
        maven { url 'https://jitpack.io' }
    }
}
```

### Android Deep Link Configuration (Required for Warm Start)

For proper deep link handling on Android when the app is already running (warm start), you must override `onNewIntent()` in your MainActivity:

**File:** `android/app/src/main/java/com/yourapp/MainActivity.kt`

```kotlin
import android.content.Intent
import com.linkzly.reactnative.LinkzlyReactNativeModule

class MainActivity : ReactActivity() {
  // ... existing code ...

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)
    LinkzlyReactNativeModule.getLatestInstance()?.handleIntent(intent)
  }
}
```

**Why is this needed?**
React Native's `Linking.addEventListener` has a known issue on Android where it doesn't reliably fire when the app receives a deep link while already running. This override ensures deep links are processed directly through the LinkzlySDK native module.

**After adding this:**
- You can remove any `Platform.OS === 'android'` workarounds using React Native's Linking API
- Deep links will work reliably on both cold and warm starts
- The SDK handles everything automatically

## Quick Start

```typescript
import React, { useEffect } from 'react';
import LinkzlySDK, { Environment } from '@linkzly/react-native-sdk';

function App() {
  useEffect(() => {
    // Configure SDK
    LinkzlySDK.configure('YOUR_SDK_KEY', Environment.PRODUCTION);

    // Listen for deep links
    const unsubscribe = LinkzlySDK.addDeepLinkListener((data) => {
      console.log('Deep link received:', data);
      // Navigate based on data.path and data.parameters
    });

    return () => unsubscribe();
  }, []);

  return <YourApp />;
}
```

The SDK automatically captures deep links from both cold starts and warm starts.

## Deep Link Handling

```typescript
const unsubscribe = LinkzlySDK.addDeepLinkListener((data) => {
  console.log('Path:', data.path);           // e.g., "/product"
  console.log('Parameters:', data.parameters); // e.g., { id: "123" }
  console.log('Smart Link ID:', data.smartLinkId);
  console.log('Click ID:', data.clickId);
});
```

### Manual Deep Link Handling

```typescript
LinkzlySDK.configure('YOUR_SDK_KEY', Environment.PRODUCTION, {
  autoHandleDeepLinks: false
});

// Then manually handle URLs
await LinkzlySDK.handleUniversalLink(url);
```

## Event Tracking

The React Native SDK bridges to the native iOS/Android implementations to automatically track lifecycle events and provides methods for manual event tracking.

### 1. Lifecycle Events (Automatic)

The SDK automatically tracks application lifecycle events:
*   **Install**: Tracked on the first launch.
*   **Open**: Tracked on every app launch.

```typescript
import LinkzlySDK from '@linkzly/react-native-sdk';

// These are called automatically, but can be manually triggered if needed
await LinkzlySDK.trackInstall(); // First launch only
await LinkzlySDK.trackOpen();    // Every app launch
```

### 2. Session Management (Manual)

Use these methods to manually control session boundaries.

```typescript
import LinkzlySDK from '@linkzly/react-native-sdk';

// Start a session
await LinkzlySDK.startSession();

// End a session
await LinkzlySDK.endSession();
```

### 3. Commerce Events

Track revenue and in-app purchases.

```typescript
import LinkzlySDK from '@linkzly/react-native-sdk';

// Track a purchase
await LinkzlySDK.trackPurchase({
  amount: 9.99,
  currency: 'USD',
  sku: 'premium_monthly'
});
```

### 4. Custom Events

Track any user interaction.

```typescript
import LinkzlySDK from '@linkzly/react-native-sdk';

// Track a custom event
await LinkzlySDK.trackEvent('tutorial_completed', { step: 5 });

// Example with more parameters
await LinkzlySDK.trackEvent('purchase_completed', {
  product_id: '12345',
  amount: 29.99,
  currency: 'USD'
});
```

### 5. Batch Tracking

Track multiple events efficiently in a single call.

```typescript
import LinkzlySDK from '@linkzly/react-native-sdk';

// Track multiple events
await LinkzlySDK.trackEventBatch([
  { eventName: 'screen_view', parameters: { screen: 'home' } },
  { eventName: 'button_click', parameters: { button: 'signup' } }
]);
```

## User Identification

```typescript
// Set user ID after authentication
await LinkzlySDK.setUserID('user_12345');

// Get current user ID
const userId = await LinkzlySDK.getUserID();

// Get persistent visitor ID
const visitorId = await LinkzlySDK.getVisitorID();

// Reset visitor ID
await LinkzlySDK.resetVisitorID();
```

## Privacy Controls

```typescript
// Enable/disable all tracking
await LinkzlySDK.setTrackingEnabled(false);
const isEnabled = await LinkzlySDK.isTrackingEnabled();

// Enable/disable advertising ID collection (IDFA/GAID)
await LinkzlySDK.setAdvertisingTrackingEnabled(true);
const isAdEnabled = await LinkzlySDK.isAdvertisingTrackingEnabled();
```

## Advertising Identifiers (IDFA/GAID)

**iOS - Request ATT Permission:**

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  const status = await LinkzlySDK.requestTrackingPermission();
  // Returns: 'authorized' | 'denied' | 'restricted' | 'notDetermined'
  
  const idfa = await LinkzlySDK.getIDFA();
  const attStatus = await LinkzlySDK.getATTStatus();
}
```

**Required `Info.plist` entry:**

```xml
<key>NSUserTrackingUsageDescription</key>
<string>We use this to provide personalized content and measure ad effectiveness.</string>
```

## SKAdNetwork Support (iOS 14+)

```typescript
// Update conversion value (0-63)
await LinkzlySDK.updateConversionValue(42);
```

## Environments

```typescript
// Development (logging enabled)
LinkzlySDK.configure('dev_key', Environment.DEVELOPMENT);

// Staging
LinkzlySDK.configure('staging_key', Environment.STAGING);

// Production (default)
LinkzlySDK.configure('prod_key', Environment.PRODUCTION);
```

## DeepLinkData API

```typescript
interface DeepLinkData {
  url?: string;                    // Original URL
  path?: string;                   // Deep link path (e.g., "/product")
  smartLinkId?: string;            // Link identifier
  clickId?: string;                // Click identifier
  parameters: Record<string, any>; // All URL parameters
}
```

## Testing Deep Links

### iOS Simulator

```bash
xcrun simctl openurl booted "https://yourdomain.com/product?id=123"
```

### Android Emulator

```bash
adb shell am start -a android.intent.action.VIEW \
  -d "https://yourdomain.com/product?id=123" \
  com.yourapp
```

## Example App

Explore a complete working example in the `example/` directory:

```bash
cd example
npm install
cd ios && pod install && cd ..

npm run ios     # Run iOS
npm run android # Run Android
```

## License

MIT

## Support

- 📧 Email: support@linkzly.com
- 📚 Documentation: https://app.linkzly.com
- 🐛 Issues: https://github.com/MarenTech/react-native-linkzly-sdk/issues
