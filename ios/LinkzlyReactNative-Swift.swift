import Foundation
import Linkzly

@objc(LinkzlyReactNativeSwift)
public class LinkzlyReactNativeSwift: NSObject {

    // Singleton instance
    @objc public static let shared = LinkzlyReactNativeSwift()

    private weak var eventEmitter: LinkzlyReactNative?
    private var hasListeners: Bool = false
    private var pendingEvents: [[String: Any]] = []

    private override init() {
        super.init()
        setupNotifications()
    }

    // MARK: - Public Methods for Event Emitter Connection

    /// Called by Obj-C bridge to connect the event emitter
    @objc public func setEventEmitter(_ emitter: LinkzlyReactNative) {
        self.eventEmitter = emitter
    }

    /// Called by Obj-C bridge when JS starts/stops listening
    @objc public func setHasListeners(_ value: Bool) {
        hasListeners = value
        if hasListeners {
            flushPendingEvents()
        }
    }

    // MARK: - Event Queue Management

    /// Queue an event if no listeners, or emit immediately if listeners exist
    private func emitOrQueueEvent(name: String, body: [String: Any]) {
        if hasListeners, let emitter = eventEmitter {
            emitter.sendEvent(withName: name, body: body)
        } else {
            // Queue the event to be sent when listeners register
            pendingEvents.append([
                "name": name,
                "body": body
            ])
        }
    }

    /// Flush all pending events to the emitter
    private func flushPendingEvents() {
        guard let emitter = eventEmitter else { return }

        for event in pendingEvents {
            if let name = event["name"] as? String,
               let body = event["body"] as? [String: Any] {
                emitter.sendEvent(withName: name, body: body)
            }
        }
        pendingEvents.removeAll()
    }

    // MARK: - Notification Setup

    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDeepLinkDataReceived),
            name: .linkzlyDeepLinkDataReceived,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleUniversalLinkReceived),
            name: .linkzlyUniversalLinkReceived,
            object: nil
        )
    }

    // MARK: - Notification Handlers

    @objc func handleDeepLinkDataReceived(_ notification: Notification) {
        guard let deepLinkData = notification.userInfo?["deepLinkData"] as? DeepLinkData else {
            return
        }

        var eventData: [String: Any] = [
            "path": deepLinkData.path ?? "",
            "parameters": deepLinkData.parameters,
            "smartLinkId": deepLinkData.smartLinkId ?? "",
            "clickId": deepLinkData.clickId ?? ""
        ]

        // Include URL if available
        if let url = notification.userInfo?["url"] as? String {
            eventData["url"] = url
        }

        emitOrQueueEvent(name: "LinkzlyDeepLinkReceived", body: eventData)
    }

    @objc func handleUniversalLinkReceived(_ notification: Notification) {
        guard let url = notification.userInfo?["url"] as? URL,
              let attributionData = notification.userInfo?["attributionData"] as? [String: Any] else {
            return
        }

        let eventData: [String: Any] = [
            "url": url.absoluteString,
            "attributionData": attributionData
        ]

        emitOrQueueEvent(name: "LinkzlyUniversalLinkReceived", body: eventData)
    }

    @objc(configureWithSdkKey:environment:resolver:rejecter:)
    public static func configure(
        sdkKey: String,
        environment: Int,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        var env: Environment
        switch environment {
        case 0:
            env = .production
        case 1:
            env = .staging
        case 2:
            env = .development
        default:
            env = .production
        }

        LinkzlySDK.configure(sdkKey: sdkKey, environment: env)
        resolver(["success": true])
    }

    @objc(handleUniversalLinkWithUrl:resolver:rejecter:)
    public static func handleUniversalLink(
        url: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard let urlObj = URL(string: url) else {
            rejecter("INVALID_URL", "Invalid URL provided", nil)
            return
        }

        let handled = LinkzlySDK.handleUniversalLink(urlObj)
        resolver(["handled": handled])
    }

    @objc(trackInstallWithResolver:rejecter:)
    public static func trackInstall(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        LinkzlySDK.trackInstall { result in
            switch result {
            case .success(let deepLinkData):
                if let data = deepLinkData {
                    var responseData: [String: Any] = [
                        "path": data.path ?? "",
                        "parameters": data.parameters,
                        "smartLinkId": data.smartLinkId ?? "",
                        "clickId": data.clickId ?? ""
                    ]
                    // Include URL if available in UserDefaults
                    if let url = UserDefaults.standard.string(forKey: "linkzly_last_deep_link_url") {
                        responseData["url"] = url
                    }
                    resolver(responseData)
                } else {
                    resolver(NSNull())
                }
            case .failure(let error):
                rejecter("TRACK_INSTALL_ERROR", error.localizedDescription, error)
            }
        }
    }

    @objc(trackOpenWithResolver:rejecter:)
    public static func trackOpen(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        LinkzlySDK.trackOpen { result in
            switch result {
            case .success(let deepLinkData):
                if let data = deepLinkData {
                    var responseData: [String: Any] = [
                        "path": data.path ?? "",
                        "parameters": data.parameters,
                        "smartLinkId": data.smartLinkId ?? "",
                        "clickId": data.clickId ?? ""
                    ]
                    // Include URL if available in UserDefaults
                    if let url = UserDefaults.standard.string(forKey: "linkzly_last_deep_link_url") {
                        responseData["url"] = url
                    }
                    resolver(responseData)
                } else {
                    resolver(NSNull())
                }
            case .failure(let error):
                rejecter("TRACK_OPEN_ERROR", error.localizedDescription, error)
            }
        }
    }

    @objc(trackEventWithEventName:parameters:resolver:rejecter:)
    public static func trackEvent(
        eventName: String,
        parameters: [String: Any]?,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        LinkzlySDK.trackEvent(eventName, parameters: parameters)
        resolver(["success": true])
    }

    @objc(trackPurchaseWithParameters:resolver:rejecter:)
    public static func trackPurchase(
        parameters: [String: Any]?,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        // LinkzlySDK.trackPurchase returns the SDK instance, or nil if not configured
        // We just need to know it was called
        LinkzlySDK.trackPurchase(parameters: parameters ?? [:]) { result in
             switch result {
             case .success(_):
                 resolver(["success": true])
             case .failure(let error):
                 rejecter("TRACK_PURCHASE_ERROR", error.localizedDescription, error)
             }
         }
    }

    @objc(trackEventBatchWithEvents:resolver:rejecter:)
    public static func trackEventBatch(
        events: [[String: Any]],
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        LinkzlySDK.trackEventBatch(events) { success, error in
            if success {
                resolver(["success": true])
            } else {
                rejecter("TRACK_BATCH_ERROR", error?.localizedDescription ?? "Unknown error", error)
            }
        }
    }

    @objc(setUserIDWithUserID:resolver:rejecter:)
    public static func setUserID(
        userID: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        LinkzlySDK.setUserID(userID)
        resolver(["success": true])
    }

    @objc(getUserIDWithResolver:rejecter:)
    public static func getUserID(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        let userID = LinkzlySDK.getUserID()
        resolver(userID ?? NSNull())
    }

    @objc(setTrackingEnabledWithEnabled:resolver:rejecter:)
    public static func setTrackingEnabled(
        enabled: Bool,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        LinkzlySDK.setTrackingEnabled(enabled)
        resolver(["success": true])
    }

    @objc(isTrackingEnabledWithResolver:rejecter:)
    public static func isTrackingEnabled(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        let enabled = LinkzlySDK.isTrackingEnabled()
        resolver(enabled)
    }

    @objc(getVisitorIDWithResolver:rejecter:)
    public static func getVisitorID(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        let visitorID = LinkzlySDK.getVisitorID()
        resolver(visitorID)
    }

    @objc(resetVisitorIDWithResolver:rejecter:)
    public static func resetVisitorID(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        LinkzlySDK.resetVisitorID()
        resolver(["success": true])
    }

    @objc(updateConversionValueWithValue:resolver:rejecter:)
    public static func updateConversionValue(
        value: Int,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        if #available(iOS 14.0, *) {
            LinkzlySDK.updateConversionValue(value) { success in
                resolver(["success": success])
            }
        } else {
            rejecter("UNSUPPORTED_IOS", "SKAdNetwork is only available on iOS 14+", nil)
        }
    }

    @objc(requestTrackingPermissionWithResolver:rejecter:)
    public static func requestTrackingPermission(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        if #available(iOS 14.5, *) {
            LinkzlySDK.requestTrackingPermissionObjC { status, error in
                if let error = error {
                    rejecter("ATT_ERROR", error.localizedDescription, error)
                } else {
                    resolver(status ?? "unknown")
                }
            }
        } else {
            rejecter("UNSUPPORTED_IOS", "App Tracking Transparency is only available on iOS 14.5+", nil)
        }
    }

    @objc(setAdvertisingTrackingEnabledWithEnabled:resolver:rejecter:)
    public static func setAdvertisingTrackingEnabled(
        enabled: Bool,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        LinkzlySDK.setAdvertisingTrackingEnabled(enabled)
        resolver(["success": true])
    }

    @objc(isAdvertisingTrackingEnabledWithResolver:rejecter:)
    public static func isAdvertisingTrackingEnabled(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        let enabled = LinkzlySDK.isAdvertisingTrackingEnabled()
        resolver(enabled)
    }

    @objc(getIDFAWithResolver:rejecter:)
    public static func getIDFA(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        let idfa = LinkzlySDK.getIDFA()
        resolver(idfa ?? NSNull())
    }

    @objc(getATTStatusWithResolver:rejecter:)
    public static func getATTStatus(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        let status = LinkzlySDK.getATTStatus()
        resolver(status ?? NSNull())
    }

    @objc(startSessionWithResolver:rejecter:)
    public static func startSession(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        LinkzlySDK.startSession()
        resolver(["success": true])
    }

    @objc(endSessionWithResolver:rejecter:)
    public static func endSession(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        LinkzlySDK.endSession()
        resolver(["success": true])
    }

    // MARK: - Flush Events and Pending Count

    @objc(flushEventsWithResolver:rejecter:)
    public static func flushEvents(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        LinkzlySDK.flushEvents { success, error in
            if success {
                resolver(["success": true])
            } else {
                rejecter("FLUSH_ERROR", error?.localizedDescription ?? "Failed to flush events", error)
            }
        }
    }

    @objc(getPendingEventCountWithResolver:rejecter:)
    public static func getPendingEventCount(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        let count = LinkzlySDK.getPendingEventCount()
        resolver(count)
    }

    // MARK: - Debug APIs (Only available in DEBUG builds)

    @objc(debugSetBatchingStrategyWithStrategy:resolver:rejecter:)
    public static func debugSetBatchingStrategy(
        strategy: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        // Debug methods not available when using Release XCFramework
        rejecter("DEBUG_ONLY", "Debug methods are only available in DEBUG builds of LinkzlySDK", nil)
    }

    @objc(debugSetBatchSizeWithSize:resolver:rejecter:)
    public static func debugSetBatchSize(
        size: Int,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        // Debug methods not available when using Release XCFramework
        rejecter("DEBUG_ONLY", "Debug methods are only available in DEBUG builds of LinkzlySDK", nil)
    }

    @objc(debugSetFlushIntervalWithInterval:resolver:rejecter:)
    public static func debugSetFlushInterval(
        interval: Double,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        // Debug methods not available when using Release XCFramework
        rejecter("DEBUG_ONLY", "Debug methods are only available in DEBUG builds of LinkzlySDK", nil)
    }

    @objc(debugSimulateServerConfigWithBatchSize:flushInterval:ttl:strategy:resolver:rejecter:)
    public static func debugSimulateServerConfig(
        batchSize: Int,
        flushInterval: Double,
        ttl: Double,
        strategy: String?,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        // Debug methods not available when using Release XCFramework
        rejecter("DEBUG_ONLY", "Debug methods are only available in DEBUG builds of LinkzlySDK", nil)
    }

    @objc(debugResetConfigWithResolver:rejecter:)
    public static func debugResetConfig(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        // Debug methods not available when using Release XCFramework
        rejecter("DEBUG_ONLY", "Debug methods are only available in DEBUG builds of LinkzlySDK", nil)
    }

    @objc(debugPrintConfigWithResolver:rejecter:)
    public static func debugPrintConfig(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        // Debug methods not available when using Release XCFramework
        rejecter("DEBUG_ONLY", "Debug methods are only available in DEBUG builds of LinkzlySDK", nil)
    }

    @objc(debugGetConfigWithResolver:rejecter:)
    public static func debugGetConfig(
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        // Debug methods not available when using Release XCFramework
        rejecter("DEBUG_ONLY", "Debug methods are only available in DEBUG builds of LinkzlySDK", nil)
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
