import { NativeModules, NativeEventEmitter, Platform, Linking } from 'react-native';

const LINKING_ERROR =
  `The package '@linkzly/react-native-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const LinkzlyReactNative = NativeModules.LinkzlyReactNative
  ? NativeModules.LinkzlyReactNative
  : new Proxy(
    {},
    {
      get() {
        throw new Error(LINKING_ERROR);
      },
    }
  );

const eventEmitter = new NativeEventEmitter(LinkzlyReactNative);

// Type definitions
export enum Environment {
  PRODUCTION = 0,
  STAGING = 1,
  DEVELOPMENT = 2,
}

export interface DeepLinkData {
  url?: string;
  path?: string;
  parameters: Record<string, any>;
  smartLinkId?: string;
  clickId?: string;
}

export interface UniversalLinkEvent {
  url: string;
  path?: string;
  parameters: Record<string, any>;
  attributionData?: Record<string, any>;
}

export interface EventParameters {
  [key: string]: string | number | boolean | any;
}

export interface BatchEvent {
  eventName: string;
  parameters?: EventParameters;
}

/**
 * Batching strategy options
 * - "all" - Batch ALL events (install, open, purchase, custom)
 * - "smart" - Smart batching: only custom events (DEFAULT)
 * - "instant" - Send ALL events instantly (no batching)
 * - "custom" - Same as "smart"
 */
export type BatchingStrategy = 'all' | 'smart' | 'instant' | 'custom';

/**
 * Debug batch configuration
 */
export interface DebugBatchConfig {
  strategy?: string;
  batchSize?: number;
  flushInterval?: number;
}

// Event listener types
export type DeepLinkListener = (data: DeepLinkData) => void;
export type UniversalLinkListener = (data: UniversalLinkEvent) => void;

class LinkzlySDK {
  // Constants
  private static readonly BACKEND_ATTRIBUTION_TIMEOUT_MS = 2000;
  private static readonly URL_PROCESSING_DEDUP_WINDOW_MS = 5000;

  // Event listeners
  private deepLinkListeners: Set<DeepLinkListener> = new Set();
  private universalLinkListeners: Set<UniversalLinkListener> = new Set();
  private deepLinkSubscription: any = null;
  private universalLinkSubscription: any = null;
  private linkingSubscription: any = null;

  // Configuration state
  private isAutoHandlingEnabled: boolean = true;
  private isConfigured: boolean = false;

  // Deep link processing state
  private pendingUrl: string | null = null;
  private processedUrls: Map<string, number> = new Map(); // URL -> timestamp
  private lastDeepLinkData: DeepLinkData | null = null;
  private pendingAttributionUrls: Set<string> = new Set(); // URLs waiting for backend attribution

  /**
   * Configure the Linkzly SDK
   * @param sdkKey Your Linkzly SDK key
   * @param environment Environment to use (production, staging, development)
   * @param options Configuration options
   * @param options.autoHandleDeepLinks Whether to automatically handle deep links (default: true)
   */
  async configure(
    sdkKey: string,
    environment: Environment = Environment.PRODUCTION,
    options?: { autoHandleDeepLinks?: boolean; autoTrackAppOpens?: boolean }
  ): Promise<void> {
    await LinkzlyReactNative.configure(sdkKey, environment);
    this.isConfigured = true;

    // Handle auto deep linking configuration
    if (options?.autoHandleDeepLinks !== undefined) {
      this.isAutoHandlingEnabled = options.autoHandleDeepLinks;
    }

    // Setup automatic deep link handling if enabled
    if (this.isAutoHandlingEnabled) {
      this.setupAutomaticDeepLinking();
    }

    // Process any pending URL that arrived before configuration
    if (this.pendingUrl) {
      await this.processDeepLink(this.pendingUrl);
      this.pendingUrl = null;
    }

    // Auto-track app open if enabled (default: true)
    const autoTrackAppOpens = options?.autoTrackAppOpens !== false;
    if (autoTrackAppOpens) {
      console.log('[LinkzlySDK] Auto-tracking app open');
      // Track open in background to not block configuration
      this.trackOpen().catch((error) => {
        console.error('[LinkzlySDK] Error auto-tracking open:', error);
      });
    }
  }

  /**
   * Handle a universal link (iOS) or app link (Android)
   * @param url The URL string to handle
   */
  async handleUniversalLink(url: string): Promise<DeepLinkData | null> {
    if (Platform.OS === 'ios') {
      await LinkzlyReactNative.handleUniversalLink(url);
      return null;
    } else {
      return await LinkzlyReactNative.handleAppLink(url);
    }
  }

  /**
   * Track an install event
   * @returns Deep link data if available
   */
  async trackInstall(): Promise<DeepLinkData | null> {
    return await LinkzlyReactNative.trackInstall();
  }

  /**
   * Track an app open event
   * @returns Deep link data if available
   */
  async trackOpen(): Promise<DeepLinkData | null> {
    return await LinkzlyReactNative.trackOpen();
  }

  /**
   * Track a custom event
   * @param eventName Name of the event
   * @param parameters Optional event parameters
   */
  async trackEvent(
    eventName: string,
    parameters?: EventParameters
  ): Promise<void> {
    await LinkzlyReactNative.trackEvent(eventName, parameters || {});
  }

  /**
   * Track a purchase event
   * @param parameters Purchase event parameters (e.g., amount, currency, items)
   */
  async trackPurchase(
    parameters?: EventParameters
  ): Promise<void> {
    await LinkzlyReactNative.trackPurchase(parameters || {});
  }

  /**
   * Track multiple events in a batch
   * @param events Array of events to track
   */
  async trackEventBatch(events: BatchEvent[]): Promise<boolean> {
    const result = await LinkzlyReactNative.trackEventBatch(events);
    return result.success;
  }

  /**
   * Manually flush pending events to the server
   *
   * This will send all queued events immediately, useful for:
   * - Testing and debugging
   * - Before critical app transitions
   * - When you want to ensure events are sent before app termination
   *
   * @returns Promise resolving to success status
   */
  async flushEvents(): Promise<boolean> {
    const result = await LinkzlyReactNative.flushEvents();
    return result.success;
  }

  /**
   * Get the count of pending events in the queue
   *
   * Useful for monitoring and debugging batched event processing
   *
   * @returns Number of events waiting to be sent
   */
  async getPendingEventCount(): Promise<number> {
    return await LinkzlyReactNative.getPendingEventCount();
  }

  /**
   * Set the user ID for attribution
   * @param userID User identifier
   */
  async setUserID(userID: string): Promise<void> {
    await LinkzlyReactNative.setUserID(userID);
  }

  /**
   * Get the current user ID
   * @returns Current user ID or null
   */
  async getUserID(): Promise<string | null> {
    return await LinkzlyReactNative.getUserID();
  }

  /**
   * Enable or disable tracking
   * @param enabled Whether tracking should be enabled
   */
  async setTrackingEnabled(enabled: boolean): Promise<void> {
    await LinkzlyReactNative.setTrackingEnabled(enabled);
  }

  /**
   * Check if tracking is enabled
   * @returns Whether tracking is enabled
   */
  async isTrackingEnabled(): Promise<boolean> {
    return await LinkzlyReactNative.isTrackingEnabled();
  }

  /**
   * Get the visitor ID
   * @returns Visitor ID
   */
  async getVisitorID(): Promise<string> {
    return await LinkzlyReactNative.getVisitorID();
  }

  /**
   * Reset the visitor ID (generates a new one)
   */
  async resetVisitorID(): Promise<void> {
    await LinkzlyReactNative.resetVisitorID();
  }

  /**
   * Update SKAdNetwork conversion value (iOS 14+ only)
   * @param value Conversion value (0-63)
   */
  async updateConversionValue(value: number): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.warn('SKAdNetwork is iOS only');
      return false;
    }
    const result = await LinkzlyReactNative.updateConversionValue(value);
    return result.success;
  }

  /**
   * Request App Tracking Transparency permission (iOS 14.5+ only)
   * @returns ATT status: 'authorized', 'denied', 'restricted', or 'notDetermined'
   */
  async requestTrackingPermission(): Promise<string> {
    if (Platform.OS !== 'ios') {
      console.warn('App Tracking Transparency is iOS only');
      return 'unsupported';
    }
    return await LinkzlyReactNative.requestTrackingPermission();
  }

  /**
   * Enable or disable advertising identifier tracking (IDFA/GAID)
   * This is separate from general analytics tracking
   * @param enabled Whether to collect advertising identifiers
   */
  async setAdvertisingTrackingEnabled(enabled: boolean): Promise<void> {
    if (!LinkzlyReactNative.setAdvertisingTrackingEnabled) {
      throw new Error(
        'setAdvertisingTrackingEnabled is not available. Make sure you have:\n' +
        '1. Run "pod install" in the ios directory\n' +
        '2. Rebuilt the app after adding native methods\n' +
        '3. The native module is properly linked'
      );
    }
    await LinkzlyReactNative.setAdvertisingTrackingEnabled(enabled);
  }

  /**
   * Check if advertising identifier tracking is enabled
   * @returns Whether advertising tracking is enabled
   */
  async isAdvertisingTrackingEnabled(): Promise<boolean> {
    return await LinkzlyReactNative.isAdvertisingTrackingEnabled();
  }

  /**
   * Manually start a new session
   * Useful for manual session management or non-standard app lifecycles
   */
  async startSession(): Promise<void> {
    await LinkzlyReactNative.startSession();
  }

  /**
   * Manually end the current session
   * Useful for manual session management or non-standard app lifecycles
   */
  async endSession(): Promise<void> {
    await LinkzlyReactNative.endSession();
  }

  /**
   * Get the current IDFA value (iOS only)
   * Returns null if ATT not authorized, advertising tracking disabled, or on Android
   * @returns IDFA string or null
   */
  async getIDFA(): Promise<string | null> {
    if (Platform.OS !== 'ios') {
      console.warn('IDFA is iOS only');
      return null;
    }
    if (!LinkzlyReactNative.getIDFA) {
      throw new Error(
        'getIDFA is not available. Make sure you have:\n' +
        '1. Run "pod install" in the ios directory\n' +
        '2. Rebuilt the app after adding native methods\n' +
        '3. The native module is properly linked'
      );
    }
    const result = await LinkzlyReactNative.getIDFA();
    return result === null || result === undefined ? null : String(result);
  }

  /**
   * Get the current ATT authorization status (iOS only)
   * Returns null if iOS < 14.5 or on Android
   * @returns ATT status: 'authorized', 'denied', 'restricted', 'notDetermined', or null
   */
  async getATTStatus(): Promise<string | null> {
    if (Platform.OS !== 'ios') {
      console.warn('ATT is iOS only');
      return null;
    }
    if (!LinkzlyReactNative.getATTStatus) {
      throw new Error(
        'getATTStatus is not available. Make sure you have:\n' +
        '1. Run "pod install" in the ios directory\n' +
        '2. Rebuilt the app after adding native methods\n' +
        '3. The native module is properly linked'
      );
    }
    const result = await LinkzlyReactNative.getATTStatus();
    return result === null || result === undefined ? null : String(result);
  }

  /**
   * Add a listener for deep link events
   * @param listener Callback function to handle deep link data
   * @returns Function to remove the listener
   */
  addDeepLinkListener(listener: DeepLinkListener): () => void {
    this.deepLinkListeners.add(listener);

    // Setup native event listener if not already done
    if (this.deepLinkSubscription === null) {
      this.deepLinkSubscription = eventEmitter.addListener(
        'LinkzlyDeepLinkReceived',
        (data: DeepLinkData) => {
          // This event can now come from multiple sources:
          // 1. Android: Direct native module emission from onNewIntent (NEW)
          // 2. iOS: handleUniversalLink native response
          // 3. Both: Backend attribution enrichment
          // 4. Both: React Native Linking.addEventListener (existing, unreliable on Android)

          // Deduplication: Skip if this URL is currently being processed
          if (data.url && this.pendingAttributionUrls.has(data.url)) {
            console.log('[LinkzlySDK] Skipping native event for URL being processed:', data.url);
            return;
          }

          // Check if this URL was just processed via processDeepLink (from Linking.addEventListener)
          // Use a shorter 2-second window for dual-emission scenarios
          if (data.url) {
            const lastProcessed = this.processedUrls.get(data.url);
            const now = Date.now();
            if (lastProcessed && (now - lastProcessed) < 2000) {
              console.log('[LinkzlySDK] Skipping duplicate native event (already processed via Linking):', data.url);
              return;
            }
            // Mark as processed to prevent Linking.addEventListener from duplicating
            this.processedUrls.set(data.url, now);
          }

          // Native events typically come from backend attribution (iOS/Android)
          // or direct intent handling (Android warm start)
          console.log('[LinkzlySDK] Native deep link event received:', {
            url: data.url,
            path: data.path,
            smartLinkId: data.smartLinkId,
            clickId: data.clickId,
          });

          this.notifyDeepLinkListeners(data);
        }
      );
    }

    // If there's cached deep link data, immediately call the listener
    if (this.lastDeepLinkData) {
      console.log('[LinkzlySDK] Calling new listener with cached deep link data');
      listener(this.lastDeepLinkData);
    }

    // Return unsubscribe function
    return () => {
      this.deepLinkListeners.delete(listener);

      // Remove native listener if no more JS listeners
      if (this.deepLinkListeners.size === 0 && this.deepLinkSubscription) {
        this.deepLinkSubscription.remove();
        this.deepLinkSubscription = null;
      }
    };
  }

  /**
   * Add a listener for universal link events
   * @param listener Callback function to handle universal link data
   * @returns Function to remove the listener
   */
  addUniversalLinkListener(listener: UniversalLinkListener): () => void {
    this.universalLinkListeners.add(listener);

    // Setup native event listener if not already done
    if (this.universalLinkSubscription === null) {
      this.universalLinkSubscription = eventEmitter.addListener(
        'LinkzlyUniversalLinkReceived',
        (data: UniversalLinkEvent) => {
          this.universalLinkListeners.forEach((l) => l(data));
        }
      );
    }

    // Return unsubscribe function
    return () => {
      this.universalLinkListeners.delete(listener);

      // Remove native listener if no more JS listeners
      if (
        this.universalLinkListeners.size === 0 &&
        this.universalLinkSubscription
      ) {
        this.universalLinkSubscription.remove();
        this.universalLinkSubscription = null;
      }
    };
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.deepLinkListeners.clear();
    this.universalLinkListeners.clear();

    if (this.deepLinkSubscription) {
      this.deepLinkSubscription.remove();
      this.deepLinkSubscription = null;
    }

    if (this.universalLinkSubscription) {
      this.universalLinkSubscription.remove();
      this.universalLinkSubscription = null;
    }

    if (this.linkingSubscription) {
      this.linkingSubscription.remove();
      this.linkingSubscription = null;
    }
  }

  /**
   * Setup automatic deep link handling
   * Captures URLs from the OS (both cold and warm starts)
   * @private
   */
  private setupAutomaticDeepLinking(): void {
    // Handle cold start - URL that opened the app
    Linking.getInitialURL()
      .then((url: string | null) => {
        if (url) {
          console.log('[LinkzlySDK] Initial URL detected (cold start):', url);
          this.processDeepLink(url).catch((error) => {
            console.error('[LinkzlySDK] Error processing initial URL:', error);
          });
        }
      })
      .catch((error: Error) => {
        console.error('[LinkzlySDK] Error getting initial URL:', error);
      });

    // Handle warm start - URL opened while app was running/backgrounded
    if (!this.linkingSubscription) {
      this.linkingSubscription = Linking.addEventListener('url', (event: { url: string }) => {
        console.log('[LinkzlySDK] URL event received (warm start):', event.url);
        this.processDeepLink(event.url).catch((error) => {
          console.error('[LinkzlySDK] Error processing URL event:', error);
        });
      });
    }
  }

  /**
   * Process a deep link URL
   * Follows professional SDK pattern: parse immediately, enrich with backend, notify once
   * @private
   */
  private async processDeepLink(url: string): Promise<void> {
    const now = Date.now();

    // Cleanup old processed URLs periodically (prevent memory leaks)
    this.cleanupOldProcessedUrls(now);

    // Deduplication: Skip if URL was processed recently (within dedup window)
    const lastProcessed = this.processedUrls.get(url);
    if (lastProcessed && (now - lastProcessed) < LinkzlySDK.URL_PROCESSING_DEDUP_WINDOW_MS) {
      console.log('[LinkzlySDK] URL processed recently, skipping duplicate:', url);
      return;
    }

    // Mark URL as being processed
    this.processedUrls.set(url, now);
    this.pendingAttributionUrls.add(url);

    // If SDK not configured yet, store URL for later processing
    if (!this.isConfigured) {
      console.log('[LinkzlySDK] SDK not configured yet, storing URL for later processing');
      this.pendingUrl = url;
      this.pendingAttributionUrls.delete(url);
      return;
    }

    try {
      // Step 1: Parse URL immediately to extract basic data
      const immediateData = this.parseUrlToDeepLinkData(url);

      // Step 2: Pass URL to native SDK (stores for backend attribution)
      // On Android, this may return immediate data; on iOS, it returns null
      const nativeData = await this.handleUniversalLink(url);

      // Step 3: Merge immediate and native data
      let mergedData = this.mergeDeepLinkData(immediateData, nativeData);

      // Step 4: Attempt to get backend attribution (with timeout)
      // This enriches data with attribution from backend if available
      const enrichedData = await this.enrichWithBackendAttribution(mergedData, url);

      // Step 5: Notify listeners once with final data
      this.notifyDeepLinkListeners(enrichedData);

      // Cleanup: Remove from pending set
      this.pendingAttributionUrls.delete(url);

    } catch (error) {
      console.error('[LinkzlySDK] Error processing deep link:', error);
      this.pendingAttributionUrls.delete(url);

      // Fallback: Notify with basic parsed data even on error
      const fallbackData = this.parseUrlToDeepLinkData(url);
      this.notifyDeepLinkListeners(fallbackData);
    }
  }

  /**
   * Parse URL string into DeepLinkData object
   * Extracts path, query parameters, and attribution IDs
   * @private
   */
  private parseUrlToDeepLinkData(url: string): DeepLinkData {
    const parameters: Record<string, any> = {};
    let path = '/';

    try {
      const urlParts = url.split('?');

      // Extract path
      if (urlParts.length > 0) {
        const urlWithoutQuery = urlParts[0];
        // Match standard URLs: protocol://host/path
        const standardMatch = urlWithoutQuery.match(/^[^:]+:\/\/[^\/]+(\/.*)?$/);
        if (standardMatch && standardMatch[1]) {
          path = standardMatch[1];
        } else {
          // Match custom schemes: scheme://path
          const customMatch = urlWithoutQuery.match(/^[^:]+:\/\/(.+)$/);
          if (customMatch && customMatch[1]) {
            path = '/' + customMatch[1];
          }
        }
      }

      // Extract query parameters
      if (urlParts.length > 1) {
        const queryString = urlParts[1];
        const params = queryString.split('&');
        params.forEach((param: string) => {
          const [key, value] = param.split('=');
          if (key && value) {
            try {
              parameters[decodeURIComponent(key)] = decodeURIComponent(value);
            } catch (e) {
              // Fallback if decoding fails
              parameters[key] = value;
            }
          }
        });
      }
    } catch (error) {
      console.warn('[LinkzlySDK] Error parsing URL:', error);
    }

    // Extract smartLinkId and clickId before removing from parameters
    const smartLinkId = parameters.slid || parameters.smartLinkId || undefined;
    const clickId = parameters.cid || parameters.clickId || undefined;

    // Remove attribution IDs from parameters to avoid duplication
    // These are extracted as top-level properties
    delete parameters.slid;
    delete parameters.smartLinkId;
    delete parameters.cid;
    delete parameters.clickId;

    return {
      url: url,
      path: path,
      parameters: parameters,
      smartLinkId: smartLinkId,
      clickId: clickId,
    };
  }

  /**
   * Merge two DeepLinkData objects, with second taking precedence
   * @private
   */
  private mergeDeepLinkData(
    primary: DeepLinkData,
    secondary: DeepLinkData | null
  ): DeepLinkData {
    if (!secondary) {
      return primary;
    }

    return {
      url: secondary.url || primary.url,
      path: secondary.path || primary.path,
      smartLinkId: secondary.smartLinkId || primary.smartLinkId,
      clickId: secondary.clickId || primary.clickId,
      parameters: {
        ...primary.parameters,
        ...secondary.parameters, // Secondary parameters override primary
      },
    };
  }

  /**
   * Attempt to enrich deep link data with backend attribution
   * Uses timeout to avoid blocking user experience
   * @private
   */
  private async enrichWithBackendAttribution(
    data: DeepLinkData,
    url: string
  ): Promise<DeepLinkData> {
    // On iOS, handleUniversalLink returns null, so we rely on native events
    // On Android, we may get immediate data but backend attribution comes later
    // For now, return the data as-is; backend attribution will come via native events
    // if available (handled by addDeepLinkListener's native event subscription)

    return data;
  }

  /**
   * Cleanup old processed URLs to prevent memory leaks
   * Removes entries older than 1 hour
   * @private
   */
  private cleanupOldProcessedUrls(now: number): void {
    const maxAge = 60 * 60 * 1000; // 1 hour
    for (const [url, timestamp] of this.processedUrls.entries()) {
      if (now - timestamp > maxAge) {
        this.processedUrls.delete(url);
      }
    }
  }

  /**
   * Notify all deep link listeners with data
   * Includes deduplication check to prevent duplicate notifications
   * @private
   */
  private notifyDeepLinkListeners(data: DeepLinkData): void {
    // Deduplication: Skip if this is the same data we just sent
    if (
      this.lastDeepLinkData &&
      this.lastDeepLinkData.url === data.url &&
      this.lastDeepLinkData.path === data.path &&
      JSON.stringify(this.lastDeepLinkData.parameters) === JSON.stringify(data.parameters) &&
      this.lastDeepLinkData.smartLinkId === data.smartLinkId &&
      this.lastDeepLinkData.clickId === data.clickId
    ) {
      console.log('[LinkzlySDK] Skipping duplicate notification for same data');
      return;
    }

    console.log('[LinkzlySDK] Notifying listeners with deep link data:', {
      url: data.url,
      path: data.path,
      smartLinkId: data.smartLinkId,
      clickId: data.clickId,
      paramCount: Object.keys(data.parameters).length,
    });

    this.lastDeepLinkData = data;
    this.deepLinkListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error('[LinkzlySDK] Error in deep link listener:', error);
      }
    });
  }

  /**
   * Enable or disable automatic deep link handling
   * @param enabled Whether automatic handling should be enabled
   */
  setAutoHandleDeepLinks(enabled: boolean): void {
    if (this.isAutoHandlingEnabled === enabled) {
      return;
    }

    this.isAutoHandlingEnabled = enabled;

    if (enabled) {
      this.setupAutomaticDeepLinking();
    } else {
      // Remove automatic listeners
      if (this.linkingSubscription) {
        this.linkingSubscription.remove();
        this.linkingSubscription = null;
      }
    }
  }

  /**
   * Check if automatic deep link handling is enabled
   * @returns Whether automatic handling is enabled
   */
  isAutoHandleDeepLinksEnabled(): boolean {
    return this.isAutoHandlingEnabled;
  }
}

/**
 * Debug utilities for testing Linkzly SDK batching behavior
 * Only available when the consuming app is in DEBUG mode
 *
 * These methods wrap the native SDK debug APIs:
 * - iOS: LinkzlySDKDebug (only available in #if DEBUG)
 * - Android: LinkzlySDKDebug (checks ApplicationInfo.FLAG_DEBUGGABLE)
 */
class LinkzlySDKDebugClass {
  /**
   * Set batching strategy for testing
   *
   * @param strategy - Strategy string:
   *   - "all" - Batch ALL events (install, open, purchase, custom)
   *   - "smart" - Smart batching: only custom events (DEFAULT)
   *   - "instant" - Send ALL events instantly (no batching)
   *   - "custom" - Same as "smart"
   */
  async setBatchingStrategy(strategy: BatchingStrategy): Promise<void> {
    await LinkzlyReactNative.debugSetBatchingStrategy(strategy);
  }

  /**
   * Set batch size for testing
   *
   * @param size - Number of events per batch (1-100)
   */
  async setBatchSize(size: number): Promise<void> {
    if (size < 1 || size > 100) {
      throw new Error('Batch size must be between 1 and 100');
    }
    await LinkzlyReactNative.debugSetBatchSize(size);
  }

  /**
   * Set flush interval for testing
   *
   * @param intervalSeconds - Flush interval in seconds (10-300)
   */
  async setFlushInterval(intervalSeconds: number): Promise<void> {
    if (intervalSeconds < 10 || intervalSeconds > 300) {
      throw new Error('Flush interval must be between 10 and 300 seconds');
    }
    await LinkzlyReactNative.debugSetFlushInterval(intervalSeconds);
  }

  /**
   * Simulate server config by setting all debug overrides at once
   *
   * This allows testing different batch configurations before the backend
   * implementation is complete.
   *
   * @param config - Configuration object
   * @param config.batchSize - Simulated batch size (1-100)
   * @param config.flushInterval - Simulated flush interval in seconds (10-300)
   * @param config.ttl - Config TTL in seconds (kept for API compatibility)
   * @param config.strategy - Optional strategy override ("all", "smart", "instant")
   */
  async simulateServerConfig(config: {
    batchSize: number;
    flushInterval: number;
    ttl?: number;
    strategy?: BatchingStrategy;
  }): Promise<void> {
    if (config.batchSize < 1 || config.batchSize > 100) {
      throw new Error('Batch size must be between 1 and 100');
    }
    if (config.flushInterval < 10 || config.flushInterval > 300) {
      throw new Error('Flush interval must be between 10 and 300 seconds');
    }
    await LinkzlyReactNative.debugSimulateServerConfig(
      config.batchSize,
      config.flushInterval,
      config.ttl ?? 300,
      config.strategy ?? null
    );
  }

  /**
   * Reset all debug overrides
   *
   * Clears all debug configuration, returning SDK to production defaults
   */
  async resetDebugConfig(): Promise<void> {
    await LinkzlyReactNative.debugResetConfig();
  }

  /**
   * Print current debug config status (logs to native console)
   */
  async printDebugConfig(): Promise<void> {
    await LinkzlyReactNative.debugPrintConfig();
  }

  /**
   * Get current debug configuration
   *
   * @returns Current debug config or null if not available
   */
  async getDebugConfig(): Promise<DebugBatchConfig | null> {
    return await LinkzlyReactNative.debugGetConfig();
  }

  /**
   * Get the number of pending events in the queue
   *
   * @returns Number of pending events
   */
  async getPendingEventCount(): Promise<number> {
    return await LinkzlyReactNative.getPendingEventCount();
  }

  /**
   * Flush all pending events immediately
   *
   * @returns Promise resolving to true if successful
   */
  async flushEvents(): Promise<boolean> {
    const result = await LinkzlyReactNative.flushEvents();
    return result.success || false;
  }
}

// Export singleton instances
const linkzlySDK = new LinkzlySDK();

/**
 * Debug utilities for testing batch event processing
 * @example
 * ```typescript
 * import LinkzlySDK, { LinkzlyDebug } from '@linkzly/react-native-sdk';
 *
 * // Test batch all strategy
 * await LinkzlyDebug.setBatchingStrategy('all');
 *
 * // Set custom batch size
 * await LinkzlyDebug.setBatchSize(5);
 *
 * // Simulate server config
 * await LinkzlyDebug.simulateServerConfig({
 *   batchSize: 10,
 *   flushInterval: 60,
 *   strategy: 'smart'
 * });
 *
 * // Reset to defaults
 * await LinkzlyDebug.resetDebugConfig();
 * ```
 */
export const LinkzlyDebug = new LinkzlySDKDebugClass();

export default linkzlySDK;
