import React, {useEffect} from 'react';
import {Platform, Alert} from 'react-native';
import LinkzlySDK, {Environment, LinkzlyDebug} from '@linkzly/react-native-sdk';
import AppNavigator from './src/navigation/AppNavigator';
import DeepLinkRouter from './src/navigation/DeepLinkRouter';

const App = () => {
  useEffect(() => {
    initSDK();
    // Deep link listeners setup
    const cleanupListeners = setupDeepLinkListeners();
    return cleanupListeners;
  }, []);

  const initSDK = async () => {
    try {
      // Configure SDK on app launch
      // Automatic deep link handling is enabled by default
      await LinkzlySDK.configure(
        'slk_55d60649a1d09efc270d03cc7fbc0aa1f7cf5d249452a417',
        Environment.DEVELOPMENT,
      );

      await LinkzlyDebug.setBatchingStrategy('smart');

      console.log('✅ Linkzly SDK configured successfully');

      // Check ATT status and IDFA (iOS only)
      if (Platform.OS === 'ios') {
        const currentAttStatus = await LinkzlySDK.getATTStatus();
        console.log('📱 ATT Status:', currentAttStatus);

        // Request ATT permission automatically on first launch
        if (currentAttStatus === 'notDetermined') {
          console.log('📱 ATT permission not yet requested, requesting now...');
          setTimeout(async () => {
            try {
              const status = await LinkzlySDK.requestTrackingPermission();
              const newIdfa = await LinkzlySDK.getIDFA();
              console.log('📱 ATT Permission:', status);
              console.log('📱 IDFA:', newIdfa || 'Not available');
            } catch (error) {
              console.error('❌ Failed to request ATT permission:', error);
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('❌ Failed to configure SDK:', error);
      Alert.alert('Error', 'Failed to configure Linkzly SDK');
    }
  };

  const setupDeepLinkListeners = () => {
    // HANDLER 1: Universal Link Capture (IMMEDIATE NAVIGATION)
    // Called when URL is captured - provides immediate navigation for installed apps
    const unsubscribeUniversal = LinkzlySDK.addUniversalLinkListener(data => {
      console.log('📎 [Universal Link] URL captured:', data.url);
      console.log('   Query params:', data.parameters);

      // Create DeepLinkData from URL parameters
      const deepLinkData = {
        url: data.url,
        path: data.path,
        smartLinkId: null, // Will be enriched by server later
        clickId: null, // Will be enriched by server later
        parameters: data.parameters,
      };

      // Navigate immediately using router
      DeepLinkRouter.handleDeepLink(deepLinkData);
    });

    // HANDLER 2: Server Attribution Data (ATTRIBUTION ENRICHMENT)
    // Called when server returns attribution data - works for fresh installs + enrichment
    const unsubscribeDeepLink = LinkzlySDK.addDeepLinkListener(deepLinkData => {
      console.log('🎯 [Attribution] Server returned enriched data:');
      console.log('   Path:', deepLinkData.path);
      console.log('   Smart Link ID:', deepLinkData.smartLinkId);
      console.log('   Click ID:', deepLinkData.clickId);
      console.log('   Product ID:', deepLinkData.parameters?.product_id);
      console.log('   URL:', deepLinkData.url);

      // Navigate (router will deduplicate if already navigated via onUniversalLink)
      DeepLinkRouter.handleDeepLink(deepLinkData);
    });

    // Cleanup listeners on component unmount
    return () => {
      unsubscribeDeepLink();
      unsubscribeUniversal();
    };
  };

  // Note: trackOpen() is automatically called by the SDK
  // - On first launch, trackInstall() is called automatically
  // - On subsequent launches, trackOpen() is called automatically when app becomes active
  // You don't need to manually call trackOpen() unless you have a specific use case

  return <AppNavigator />;
};

export default App;
