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
import LinkzlySDK, {LinkzlyDebug} from '@linkzly/react-native-sdk';

const SettingsScreen = () => {
  const [isAdvertisingTracking, setIsAdvertisingTracking] = useState(true);
  const [attStatus, setAttStatus] = useState<string>('Not Requested');
  const [idfa, setIdfa] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const adTracking = await LinkzlySDK.isAdvertisingTrackingEnabled();
      setIsAdvertisingTracking(adTracking);

      if (Platform.OS === 'ios') {
        const currentAttStatus = await LinkzlySDK.getATTStatus();
        setAttStatus(currentAttStatus || 'Not Requested');

        const currentIdfa = await LinkzlySDK.getIDFA();
        setIdfa(currentIdfa);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleToggleAdvertisingTracking = async () => {
    if (Platform.OS === 'ios' && attStatus !== 'authorized') {
      const actionText =
        attStatus === 'notDetermined' ? 'Request Permission' : 'Open Settings';
      const actionHandler =
        attStatus === 'notDetermined'
          ? handleRequestATTPermission
          : openAppSettings;

      Alert.alert(
        'ATT Permission Required',
        `Current ATT Status: ${attStatus}\n\n` +
          (attStatus === 'notDetermined'
            ? 'You must grant App Tracking Transparency permission before enabling ad tracking.'
            : 'You need to enable tracking permission in Settings first.\n\nGo to: Settings → LinkzlyExample → Allow Apps to Request to Track'),
        [
          {text: 'Cancel', style: 'cancel'},
          {text: actionText, onPress: actionHandler},
        ],
      );
      return;
    }

    try {
      const newState = !isAdvertisingTracking;
      await LinkzlySDK.setAdvertisingTrackingEnabled(newState);
      setIsAdvertisingTracking(newState);
      console.log('🎯 Advertising tracking state:', newState);
      Alert.alert(
        'Success',
        `Advertising tracking ${newState ? 'enabled' : 'disabled'}`,
      );
    } catch (error) {
      console.error('❌ Toggle advertising tracking error:', error);
      Alert.alert('Error', 'Failed to toggle advertising tracking');
    }
  };

  const openAppSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert('Error', 'Unable to open Settings');
    });
  };

  const handleRequestATTPermission = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert(
        'Android Advertising Tracking',
        'On Android, advertising identifiers are controlled by:\n\n' +
          '1. Google Play Services availability\n' +
          '2. User LAT (Limit Ad Tracking) setting\n' +
          '3. App advertising tracking consent\n\n' +
          'Tap "Open Settings" to manage your Google Ads preferences.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Open Settings',
            onPress: () => {
              Linking.openURL('google-settings://ads').catch(() => {
                openAppSettings();
              });
            },
          },
        ],
      );
      return;
    }

    const currentStatus = await LinkzlySDK.getATTStatus();

    if (currentStatus === 'denied') {
      Alert.alert(
        'ATT Permission Denied',
        'You previously denied tracking permission for this app.\n\n' +
          'To enable tracking, you need to:\n' +
          '1. Open Settings\n' +
          '2. Scroll to "LinkzlyExample"\n' +
          '3. Enable "Allow Apps to Request to Track"\n\n' +
          'Would you like to open Settings now?',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open Settings', onPress: openAppSettings},
        ],
      );
      return;
    }

    if (currentStatus === 'authorized') {
      const currentIdfa = await LinkzlySDK.getIDFA();
      Alert.alert(
        'ATT Permission Already Granted',
        `Tracking permission is already authorized.\n\nIDFA: ${
          currentIdfa || 'Not available'
        }\n\n` + 'You can revoke this permission in Settings if needed.',
        [
          {text: 'OK', style: 'default'},
          {text: 'Open Settings', onPress: openAppSettings},
        ],
      );
      return;
    }

    try {
      const status = await LinkzlySDK.requestTrackingPermission();
      setAttStatus(status);
      console.log('📱 ATT Permission status:', status);

      const currentIdfa = await LinkzlySDK.getIDFA();
      setIdfa(currentIdfa);

      let message = '';
      let buttons: any[] = [{text: 'OK', style: 'default'}];

      switch (status) {
        case 'authorized':
          message = `Permission granted! IDFA will be collected.\n\nIDFA: ${
            currentIdfa || 'Not available'
          }`;
          break;
        case 'denied':
          message =
            'Permission denied. IDFA will not be collected.\n\nYou can change this later in Settings → LinkzlyExample → Allow Tracking.';
          buttons = [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: openAppSettings},
          ];
          break;
        case 'restricted':
          message =
            'Permission restricted by parental controls or device management.';
          buttons = [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: openAppSettings},
          ];
          break;
      }

      Alert.alert('ATT Permission', message, buttons);
    } catch (error) {
      console.error('❌ Request ATT permission error:', error);
      Alert.alert('Error', 'Failed to request tracking permission');
    }
  };

  const handleRefreshIDFA = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Info', 'IDFA is iOS only');
      return;
    }

    try {
      const currentIdfa = await LinkzlySDK.getIDFA();
      const currentAttStatus = await LinkzlySDK.getATTStatus();
      setIdfa(currentIdfa);
      setAttStatus(currentAttStatus || 'Not Requested');

      Alert.alert(
        'IDFA Status',
        `ATT Status: ${currentAttStatus || 'Not Requested'}\n\nIDFA: ${
          currentIdfa ||
          'Not available (ATT not authorized or advertising tracking disabled)'
        }`,
      );
    } catch (error) {
      console.error('❌ Refresh IDFA error:', error);
      Alert.alert('Error', 'Failed to refresh IDFA');
    }
  };

  const canTrackAdvertising =
    Platform.OS === 'ios'
      ? attStatus === 'authorized' && isAdvertisingTracking
      : isAdvertisingTracking;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Privacy & Tracking Preferences</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advertising Tracking</Text>

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
            <Text style={styles.infoText}>
              SDK Ad Tracking: {isAdvertisingTracking ? '✅ Enabled' : '❌ Disabled'}
            </Text>
            <Text
              style={[
                styles.infoText,
                styles.infoTextBold,
                canTrackAdvertising
                  ? styles.statusEnabled
                  : styles.statusDisabled,
              ]}>
              Actual Ad Tracking:{' '}
              {canTrackAdvertising ? '✅ ACTIVE (Collecting IDFA)' : '❌ BLOCKED'}
            </Text>
            <Text style={styles.infoText}>
              IDFA:{' '}
              {idfa && idfa !== '00000000-0000-0000-0000-000000000000'
                ? idfa
                : '❌ Not available'}
            </Text>
          </>
        )}

        {Platform.OS === 'android' && (
          <Text style={styles.infoText}>
            Ad Tracking: {isAdvertisingTracking ? '✅ Enabled' : '❌ Disabled'}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            Platform.OS === 'ios' && attStatus !== 'authorized'
              ? styles.buttonDisabled
              : isAdvertisingTracking
              ? styles.buttonDanger
              : styles.buttonSuccess,
          ]}
          onPress={handleToggleAdvertisingTracking}
          disabled={Platform.OS === 'ios' && attStatus === 'restricted'}>
          <Text style={styles.buttonText}>
            {Platform.OS === 'ios'
              ? attStatus === 'authorized'
                ? isAdvertisingTracking
                  ? 'Disable SDK Ad Tracking'
                  : 'Enable SDK Ad Tracking'
                : attStatus === 'denied'
                ? '⚠️ ATT Denied - Cannot Track'
                : attStatus === 'restricted'
                ? '⚠️ ATT Restricted'
                : '⚠️ Request ATT Permission First'
              : isAdvertisingTracking
              ? 'Disable Ad Tracking'
              : 'Enable Ad Tracking'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            Platform.OS === 'ios' && attStatus === 'authorized'
              ? styles.buttonSuccess
              : Platform.OS === 'ios' && attStatus === 'denied'
              ? styles.buttonDanger
              : Platform.OS === 'ios' && attStatus === 'restricted'
              ? styles.buttonDisabled
              : styles.buttonWarning,
          ]}
          onPress={handleRequestATTPermission}
          disabled={Platform.OS === 'ios' && attStatus === 'restricted'}>
          <Text style={styles.buttonText}>
            {Platform.OS === 'ios'
              ? attStatus === 'authorized'
                ? '✅ ATT Permission Granted'
                : attStatus === 'denied'
                ? '❌ ATT Permission Denied'
                : attStatus === 'restricted'
                ? '⚠️ ATT Restricted'
                : '🔓 Request ATT Permission'
              : 'View Ad Tracking Info'}
          </Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.buttonInfo]}
              onPress={handleRefreshIDFA}>
              <Text style={styles.buttonText}>Refresh IDFA Status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonInfo]}
              onPress={openAppSettings}>
              <Text style={styles.buttonText}>⚙️ Open App Settings</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SDK Features</Text>
        <Text style={styles.infoText}>
          Test session management and event batching
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonHalfWidth, styles.buttonSuccess]}
            onPress={async () => {
              try {
                await LinkzlySDK.startSession();
                console.log('🔄 Manual session start triggered');
                Alert.alert('Success', 'New session started');
              } catch (error) {
                console.error('❌ Start session error:', error);
                Alert.alert('Error', 'Failed to start session');
              }
            }}>
            <Text style={styles.buttonText}>▶️ Start Session</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonHalfWidth, styles.buttonDanger]}
            onPress={async () => {
              try {
                await LinkzlySDK.endSession();
                console.log('🔄 Manual session end triggered');
                Alert.alert('Success', 'Session ended');
              } catch (error) {
                console.error('❌ End session error:', error);
                Alert.alert('Error', 'Failed to end session');
              }
            }}>
            <Text style={styles.buttonText}>⏹ End Session</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.buttonInfo]}
          onPress={async () => {
            try {
              const count = await LinkzlyDebug.getPendingEventCount();
              console.log('📊 Pending events:', count);
              Alert.alert('Pending Events', `There are ${count} events in the queue`);
            } catch (error) {
              console.error('❌ Get pending events error:', error);
              Alert.alert('Error', 'Failed to get pending event count');
            }
          }}>
          <Text style={styles.buttonText}>📊 Check Pending Events</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonWarning]}
          onPress={async () => {
            try {
              await LinkzlyDebug.flushEvents();
              console.log('✅ Events flushed successfully');
              Alert.alert('Success', 'All pending events have been flushed to the server');
            } catch (error) {
              console.error('❌ Flush events error:', error);
              Alert.alert('Error', 'Failed to flush events');
            }
          }}>
          <Text style={styles.buttonText}>🚀 Flush Events Now</Text>
        </TouchableOpacity>

        <Text style={[styles.infoText, {marginTop: 10, fontSize: 12}]}>
          Note: SDK automatically manages sessions based on app lifecycle. These controls are for testing manual session management.
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>About Advertising Identifiers</Text>
        {Platform.OS === 'ios' ? (
          <>
            <Text style={styles.infoBoxText}>
              • <Text style={styles.bold}>Two levels of control:</Text>
            </Text>
            <Text style={styles.infoBoxText}>
              {'  '}1. ATT Permission (iOS System) - Must be "Authorized"
            </Text>
            <Text style={styles.infoBoxText}>
              {'  '}2. SDK Ad Tracking (App Level) - Must be "Enabled"
            </Text>
            <Text style={styles.infoBoxText}>
              • <Text style={styles.bold}>Both must be enabled</Text> to collect
              IDFA
            </Text>
            <Text style={styles.infoBoxText}>
              • IDFA: Used for personalized ads and attribution
            </Text>
            <Text style={styles.infoBoxText}>
              • IDFV: Vendor-specific identifier (always available)
            </Text>
            <Text style={styles.infoBoxText}>
              • If ATT denied, IDFA returns all zeros
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.infoBoxText}>
              • GAID: Google Advertising ID (Play Services)
            </Text>
            <Text style={styles.infoBoxText}>
              • AndroidID: Device-specific identifier
            </Text>
            <Text style={styles.infoBoxText}>
              • LAT: User can limit ad tracking in settings
            </Text>
            <Text style={styles.infoBoxText}>
              • Sent automatically with events when available
            </Text>
          </>
        )}
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
  section: {
    margin: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#2196f3',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonHalfWidth: {
    flex: 1,
  },
  buttonSuccess: {
    backgroundColor: '#4caf50',
  },
  buttonDanger: {
    backgroundColor: '#f44336',
  },
  buttonWarning: {
    backgroundColor: '#ff9800',
  },
  buttonDisabled: {
    backgroundColor: '#9e9e9e',
  },
  buttonInfo: {
    backgroundColor: '#2196f3',
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
  bold: {
    fontWeight: '600',
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

export default SettingsScreen;
