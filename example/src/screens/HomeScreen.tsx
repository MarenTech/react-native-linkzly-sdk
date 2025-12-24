import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import LinkzlySDK, {Environment} from '@linkzly/react-native-sdk';
import DeepLinkRouter from '../navigation/DeepLinkRouter';

const HomeScreen = () => {
  const [visitorId, setVisitorId] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(true);
  const [isAdvertisingTracking, setIsAdvertisingTracking] = useState(true);
  const [attStatus, setAttStatus] = useState<string>('Not Requested');
  const [idfa, setIdfa] = useState<string | null>(null);
  const [lastDeepLink, setLastDeepLink] = useState<any>(null);

  // Computed state: actual tracking capability based on ATT status
  const canTrackAdvertising =
    Platform.OS === 'ios'
      ? attStatus === 'authorized' && isAdvertisingTracking
      : isAdvertisingTracking;

  useEffect(() => {
    loadSDKStatus();
  }, []);

  const loadSDKStatus = async () => {
    try {
      const vId = await LinkzlySDK.getVisitorID();
      setVisitorId(vId);

      const tracking = await LinkzlySDK.isTrackingEnabled();
      setIsTracking(tracking);

      const adTracking = await LinkzlySDK.isAdvertisingTrackingEnabled();
      setIsAdvertisingTracking(adTracking);

      if (Platform.OS === 'ios') {
        const currentAttStatus = await LinkzlySDK.getATTStatus();
        setAttStatus(currentAttStatus || 'Not Requested');

        const currentIdfa = await LinkzlySDK.getIDFA();
        setIdfa(currentIdfa);
      }

      // Get current deep link data
      const deepLinkData = DeepLinkRouter.getCurrentDeepLinkData();
      if (deepLinkData) {
        setLastDeepLink(deepLinkData);
      }
    } catch (error) {
      console.error('Failed to load SDK status:', error);
    }
  };

  const handleTrackInstall = async () => {
    try {
      const result = await LinkzlySDK.trackInstall();
      console.log('📥 Install tracked:', result);
      Alert.alert('Success', 'Install tracked successfully');
      if (result) {
        setLastDeepLink(result);
      }
    } catch (error) {
      console.error('❌ Track install error:', error);
      Alert.alert('Error', 'Failed to track install');
    }
  };

  const handleTrackOpen = async () => {
    try {
      const result = await LinkzlySDK.trackOpen();
      console.log('📂 Open tracked:', result);
      Alert.alert('Success', 'Open tracked successfully');
      if (result) {
        setLastDeepLink(result);
      }
    } catch (error) {
      console.error('❌ Track open error:', error);
      Alert.alert('Error', 'Failed to track open');
    }
  };

  const handleTrackCustomEvent = async () => {
    try {
      await LinkzlySDK.trackEvent('button_click', {
        button_name: 'test_button',
        screen: 'home',
        timestamp: Date.now(),
      });
      console.log('✅ Custom event tracked');
      Alert.alert('Success', 'Custom event tracked');
    } catch (error) {
      console.error('❌ Track event error:', error);
      Alert.alert('Error', 'Failed to track event');
    }
  };

  const handleSetUserId = async () => {
    try {
      const newUserId = `user_${Date.now()}`;
      await LinkzlySDK.setUserID(newUserId);
      setUserId(newUserId);
      console.log('👤 User ID set:', newUserId);
      Alert.alert('Success', `User ID set to: ${newUserId}`);
    } catch (error) {
      console.error('❌ Set user ID error:', error);
      Alert.alert('Error', 'Failed to set user ID');
    }
  };

  const handleResetVisitorId = async () => {
    try {
      await LinkzlySDK.resetVisitorID();
      const newVisitorId = await LinkzlySDK.getVisitorID();
      setVisitorId(newVisitorId);
      console.log('🔄 Visitor ID reset:', newVisitorId);
      Alert.alert('Success', `New Visitor ID: ${newVisitorId}`);
    } catch (error) {
      console.error('❌ Reset visitor ID error:', error);
      Alert.alert('Error', 'Failed to reset visitor ID');
    }
  };

  const handleToggleTracking = async () => {
    try {
      const newState = !isTracking;
      await LinkzlySDK.setTrackingEnabled(newState);
      setIsTracking(newState);
      console.log('🎯 Tracking state:', newState);
      Alert.alert('Success', `Tracking ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Toggle tracking error:', error);
      Alert.alert('Error', 'Failed to toggle tracking');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Linkzly SDK Example</Text>
        <Text style={styles.subtitle}>Deep Linking & Attribution Demo</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>SDK Information</Text>
        <Text style={styles.infoText}>Visitor ID: {visitorId.substring(0, 8)}...</Text>
        <Text style={styles.infoText}>User ID: {userId || 'Not set'}</Text>
        <Text style={styles.infoText}>
          Tracking: {isTracking ? '✅ Enabled' : '❌ Disabled'}
        </Text>

        {Platform.OS === 'ios' && (
          <>
            <Text style={styles.infoText}>
              ATT Status:{' '}
              {attStatus === 'authorized'
                ? '✅ Authorized'
                : attStatus === 'denied'
                ? '❌ Denied'
                : attStatus === 'restricted'
                ? '⚠️ Restricted'
                : '⏳ Not Requested'}
            </Text>
            <Text
              style={[
                styles.infoText,
                styles.infoTextBold,
                canTrackAdvertising
                  ? styles.statusEnabled
                  : styles.statusDisabled,
              ]}>
              Ad Tracking: {canTrackAdvertising ? '✅ ACTIVE' : '❌ BLOCKED'}
            </Text>
          </>
        )}
      </View>

      {lastDeepLink && (
        <View style={styles.deepLinkSection}>
          <Text style={styles.sectionTitle}>Last Deep Link</Text>
          {lastDeepLink.url && (
            <View style={styles.urlContainer}>
              <Text style={styles.urlLabel}>URL:</Text>
              <Text style={styles.urlText}>{lastDeepLink.url}</Text>
            </View>
          )}
          <Text style={styles.deepLinkText}>
            {JSON.stringify(lastDeepLink, null, 2)}
          </Text>
        </View>
      )}

      <View style={styles.buttonsSection}>
        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity style={styles.button} onPress={handleTrackInstall}>
          <Text style={styles.buttonText}>Track Install</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleTrackOpen}>
          <Text style={styles.buttonText}>Track Open</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleTrackCustomEvent}>
          <Text style={styles.buttonText}>Track Custom Event</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleSetUserId}>
          <Text style={styles.buttonText}>Set User ID</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleResetVisitorId}>
          <Text style={styles.buttonText}>Reset Visitor ID</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            isTracking ? styles.buttonDanger : styles.buttonSuccess,
          ]}
          onPress={handleToggleTracking}>
          <Text style={styles.buttonText}>
            {isTracking ? 'Disable Tracking' : 'Enable Tracking'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>Deep Linking Test</Text>
        <Text style={styles.infoBoxText}>
          • Navigate to Products tab to see the product catalog
        </Text>
        <Text style={styles.infoBoxText}>
          • Click on any product to view details
        </Text>
        <Text style={styles.infoBoxText}>
          • Test deep links by opening URLs in Terminal/ADB
        </Text>
        <Text style={styles.infoBoxText}>
          • Attribution data will appear in the "Last Deep Link" section
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  infoSection: {
    margin: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  deepLinkSection: {
    margin: 10,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
  },
  urlContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  urlLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  urlText: {
    fontSize: 11,
    color: '#1976d2',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  deepLinkText: {
    fontSize: 12,
    color: '#1976d2',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  buttonsSection: {
    margin: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#2196f3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonSuccess: {
    backgroundColor: '#4caf50',
  },
  buttonDanger: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoTextBold: {
    fontWeight: '700',
    fontSize: 15,
  },
  statusEnabled: {
    color: '#2e7d32',
  },
  statusDisabled: {
    color: '#c62828',
  },
  infoBox: {
    margin: 10,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffc107',
    marginBottom: 30,
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 10,
  },
  infoBoxText: {
    fontSize: 13,
    color: '#856404',
    marginBottom: 5,
  },
});

export default HomeScreen;
