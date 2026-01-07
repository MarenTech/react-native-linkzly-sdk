export declare enum Environment {
    PRODUCTION = 0,
    STAGING = 1,
    DEVELOPMENT = 2
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
export type DeepLinkListener = (data: DeepLinkData) => void;
export type UniversalLinkListener = (data: UniversalLinkEvent) => void;
declare class LinkzlySDK {
    private static readonly BACKEND_ATTRIBUTION_TIMEOUT_MS;
    private static readonly URL_PROCESSING_DEDUP_WINDOW_MS;
    private deepLinkListeners;
    private universalLinkListeners;
    private deepLinkSubscription;
    private universalLinkSubscription;
    private linkingSubscription;
    private isAutoHandlingEnabled;
    private isConfigured;
    private pendingUrl;
    private processedUrls;
    private lastDeepLinkData;
    private pendingAttributionUrls;
    /**
     * Configure the Linkzly SDK
     * @param sdkKey Your Linkzly SDK key
     * @param environment Environment to use (production, staging, development)
     * @param options Configuration options
     * @param options.autoHandleDeepLinks Whether to automatically handle deep links (default: true)
     */
    configure(sdkKey: string, environment?: Environment, options?: {
        autoHandleDeepLinks?: boolean;
        autoTrackAppOpens?: boolean;
    }): Promise<void>;
    /**
     * Handle a universal link (iOS) or app link (Android)
     * @param url The URL string to handle
     */
    handleUniversalLink(url: string): Promise<DeepLinkData | null>;
    /**
     * Track an install event
     * @returns Deep link data if available
     */
    trackInstall(): Promise<DeepLinkData | null>;
    /**
     * Track an app open event
     * @returns Deep link data if available
     */
    trackOpen(): Promise<DeepLinkData | null>;
    /**
     * Track a custom event
     * @param eventName Name of the event
     * @param parameters Optional event parameters
     */
    trackEvent(eventName: string, parameters?: EventParameters): Promise<void>;
    /**
     * Track a purchase event
     * @param parameters Purchase event parameters (e.g., amount, currency, items)
     */
    trackPurchase(parameters?: EventParameters): Promise<void>;
    /**
     * Track multiple events in a batch
     * @param events Array of events to track
     */
    trackEventBatch(events: BatchEvent[]): Promise<boolean>;
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
    flushEvents(): Promise<boolean>;
    /**
     * Get the count of pending events in the queue
     *
     * Useful for monitoring and debugging batched event processing
     *
     * @returns Number of events waiting to be sent
     */
    getPendingEventCount(): Promise<number>;
    /**
     * Set the user ID for attribution
     * @param userID User identifier
     */
    setUserID(userID: string): Promise<void>;
    /**
     * Get the current user ID
     * @returns Current user ID or null
     */
    getUserID(): Promise<string | null>;
    /**
     * Enable or disable tracking
     * @param enabled Whether tracking should be enabled
     */
    setTrackingEnabled(enabled: boolean): Promise<void>;
    /**
     * Check if tracking is enabled
     * @returns Whether tracking is enabled
     */
    isTrackingEnabled(): Promise<boolean>;
    /**
     * Get the visitor ID
     * @returns Visitor ID
     */
    getVisitorID(): Promise<string>;
    /**
     * Reset the visitor ID (generates a new one)
     */
    resetVisitorID(): Promise<void>;
    /**
     * Update SKAdNetwork conversion value (iOS 14+ only)
     * @param value Conversion value (0-63)
     */
    updateConversionValue(value: number): Promise<boolean>;
    /**
     * Request App Tracking Transparency permission (iOS 14.5+ only)
     * @returns ATT status: 'authorized', 'denied', 'restricted', or 'notDetermined'
     */
    requestTrackingPermission(): Promise<string>;
    /**
     * Enable or disable advertising identifier tracking (IDFA/GAID)
     * This is separate from general analytics tracking
     * @param enabled Whether to collect advertising identifiers
     */
    setAdvertisingTrackingEnabled(enabled: boolean): Promise<void>;
    /**
     * Check if advertising identifier tracking is enabled
     * @returns Whether advertising tracking is enabled
     */
    isAdvertisingTrackingEnabled(): Promise<boolean>;
    /**
     * Manually start a new session
     * Useful for manual session management or non-standard app lifecycles
     */
    startSession(): Promise<void>;
    /**
     * Manually end the current session
     * Useful for manual session management or non-standard app lifecycles
     */
    endSession(): Promise<void>;
    /**
     * Get the current IDFA value (iOS only)
     * Returns null if ATT not authorized, advertising tracking disabled, or on Android
     * @returns IDFA string or null
     */
    getIDFA(): Promise<string | null>;
    /**
     * Get the current ATT authorization status (iOS only)
     * Returns null if iOS < 14.5 or on Android
     * @returns ATT status: 'authorized', 'denied', 'restricted', 'notDetermined', or null
     */
    getATTStatus(): Promise<string | null>;
    /**
     * Add a listener for deep link events
     * @param listener Callback function to handle deep link data
     * @returns Function to remove the listener
     */
    addDeepLinkListener(listener: DeepLinkListener): () => void;
    /**
     * Add a listener for universal link events
     * @param listener Callback function to handle universal link data
     * @returns Function to remove the listener
     */
    addUniversalLinkListener(listener: UniversalLinkListener): () => void;
    /**
     * Remove all event listeners
     */
    removeAllListeners(): void;
    /**
     * Setup automatic deep link handling
     * Captures URLs from the OS (both cold and warm starts)
     * @private
     */
    private setupAutomaticDeepLinking;
    /**
     * Process a deep link URL
     * Follows professional SDK pattern: parse immediately, enrich with backend, notify once
     * @private
     */
    private processDeepLink;
    /**
     * Parse URL string into DeepLinkData object
     * Extracts path, query parameters, and attribution IDs
     * @private
     */
    private parseUrlToDeepLinkData;
    /**
     * Merge two DeepLinkData objects, with second taking precedence
     * @private
     */
    private mergeDeepLinkData;
    /**
     * Attempt to enrich deep link data with backend attribution
     * Uses timeout to avoid blocking user experience
     * @private
     */
    private enrichWithBackendAttribution;
    /**
     * Cleanup old processed URLs to prevent memory leaks
     * Removes entries older than 1 hour
     * @private
     */
    private cleanupOldProcessedUrls;
    /**
     * Notify all deep link listeners with data
     * Includes deduplication check to prevent duplicate notifications
     * @private
     */
    private notifyDeepLinkListeners;
    /**
     * Enable or disable automatic deep link handling
     * @param enabled Whether automatic handling should be enabled
     */
    setAutoHandleDeepLinks(enabled: boolean): void;
    /**
     * Check if automatic deep link handling is enabled
     * @returns Whether automatic handling is enabled
     */
    isAutoHandleDeepLinksEnabled(): boolean;
}
/**
 * Debug utilities for testing Linkzly SDK batching behavior
 * Only available when the consuming app is in DEBUG mode
 *
 * These methods wrap the native SDK debug APIs:
 * - iOS: LinkzlySDKDebug (only available in #if DEBUG)
 * - Android: LinkzlySDKDebug (checks ApplicationInfo.FLAG_DEBUGGABLE)
 */
declare class LinkzlySDKDebugClass {
    /**
     * Set batching strategy for testing
     *
     * @param strategy - Strategy string:
     *   - "all" - Batch ALL events (install, open, purchase, custom)
     *   - "smart" - Smart batching: only custom events (DEFAULT)
     *   - "instant" - Send ALL events instantly (no batching)
     *   - "custom" - Same as "smart"
     */
    setBatchingStrategy(strategy: BatchingStrategy): Promise<void>;
    /**
     * Set batch size for testing
     *
     * @param size - Number of events per batch (1-100)
     */
    setBatchSize(size: number): Promise<void>;
    /**
     * Set flush interval for testing
     *
     * @param intervalSeconds - Flush interval in seconds (10-300)
     */
    setFlushInterval(intervalSeconds: number): Promise<void>;
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
    simulateServerConfig(config: {
        batchSize: number;
        flushInterval: number;
        ttl?: number;
        strategy?: BatchingStrategy;
    }): Promise<void>;
    /**
     * Reset all debug overrides
     *
     * Clears all debug configuration, returning SDK to production defaults
     */
    resetDebugConfig(): Promise<void>;
    /**
     * Print current debug config status (logs to native console)
     */
    printDebugConfig(): Promise<void>;
    /**
     * Get current debug configuration
     *
     * @returns Current debug config or null if not available
     */
    getDebugConfig(): Promise<DebugBatchConfig | null>;
    /**
     * Get the number of pending events in the queue
     *
     * @returns Number of pending events
     */
    getPendingEventCount(): Promise<number>;
    /**
     * Flush all pending events immediately
     *
     * @returns Promise resolving to true if successful
     */
    flushEvents(): Promise<boolean>;
}
declare const linkzlySDK: LinkzlySDK;
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
export declare const LinkzlyDebug: LinkzlySDKDebugClass;
export default linkzlySDK;
//# sourceMappingURL=index.d.ts.map