#import "LinkzlyReactNative.h"
#import "LinkzlyReactNative-Swift.h"

@implementation LinkzlyReactNative

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[ @"LinkzlyDeepLinkReceived", @"LinkzlyUniversalLinkReceived" ];
}

RCT_EXPORT_METHOD(configure : (NSString *)sdkKey environment : (NSInteger)
                      environment resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift configureWithSdkKey:sdkKey
                                   environment:environment
                                      resolver:resolve
                                      rejecter:reject];
}

RCT_EXPORT_METHOD(handleUniversalLink : (NSString *)url resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift handleUniversalLinkWithUrl:url
                                             resolver:resolve
                                             rejecter:reject];
}

RCT_EXPORT_METHOD(trackInstall : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift trackInstallWithResolver:resolve rejecter:reject];
}

RCT_EXPORT_METHOD(trackOpen : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift trackOpenWithResolver:resolve rejecter:reject];
}

RCT_EXPORT_METHOD(trackEvent : (NSString *)eventName parameters : (
    NSDictionary *)parameters resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift trackEventWithEventName:eventName
                                        parameters:parameters
                                          resolver:resolve
                                          rejecter:reject];
}

RCT_EXPORT_METHOD(trackPurchase : (NSDictionary *)parameters resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift trackPurchaseWithParameters:parameters
                                              resolver:resolve
                                              rejecter:reject];
}

RCT_EXPORT_METHOD(trackEventBatch : (NSArray *)events resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift trackEventBatchWithEvents:events
                                            resolver:resolve
                                            rejecter:reject];
}

RCT_EXPORT_METHOD(setUserID : (NSString *)userID resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift setUserIDWithUserID:userID
                                      resolver:resolve
                                      rejecter:reject];
}

RCT_EXPORT_METHOD(getUserID : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift getUserIDWithResolver:resolve rejecter:reject];
}

RCT_EXPORT_METHOD(setTrackingEnabled : (BOOL)enabled resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift setTrackingEnabledWithEnabled:enabled
                                                resolver:resolve
                                                rejecter:reject];
}

RCT_EXPORT_METHOD(isTrackingEnabled : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift isTrackingEnabledWithResolver:resolve
                                                rejecter:reject];
}

RCT_EXPORT_METHOD(getVisitorID : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift getVisitorIDWithResolver:resolve rejecter:reject];
}

RCT_EXPORT_METHOD(resetVisitorID : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift resetVisitorIDWithResolver:resolve rejecter:reject];
}

RCT_EXPORT_METHOD(updateConversionValue : (NSInteger)value resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift updateConversionValueWithValue:value
                                                 resolver:resolve
                                                 rejecter:reject];
}

RCT_EXPORT_METHOD(requestTrackingPermission : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift requestTrackingPermissionWithResolver:resolve
                                                        rejecter:reject];
}

RCT_EXPORT_METHOD(setAdvertisingTrackingEnabled : (BOOL)enabled resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift setAdvertisingTrackingEnabledWithEnabled:enabled
                                                           resolver:resolve
                                                           rejecter:reject];
}

RCT_EXPORT_METHOD(isAdvertisingTrackingEnabled : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift isAdvertisingTrackingEnabledWithResolver:resolve
                                                           rejecter:reject];
}

RCT_EXPORT_METHOD(getIDFA : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift getIDFAWithResolver:resolve rejecter:reject];
}

RCT_EXPORT_METHOD(getATTStatus : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift getATTStatusWithResolver:resolve rejecter:reject];
}

RCT_EXPORT_METHOD(startSession : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift startSessionWithResolver:resolve rejecter:reject];
}

RCT_EXPORT_METHOD(endSession : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift endSessionWithResolver:resolve rejecter:reject];
}

// MARK: - Flush Events and Pending Count

RCT_EXPORT_METHOD(flushEvents : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift flushEventsWithResolver:resolve rejecter:reject];
}

RCT_EXPORT_METHOD(getPendingEventCount : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift getPendingEventCountWithResolver:resolve
                                                   rejecter:reject];
}

// MARK: - Debug APIs (Only available in DEBUG builds)

RCT_EXPORT_METHOD(debugSetBatchingStrategy : (NSString *)strategy resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift debugSetBatchingStrategyWithStrategy:strategy
                                                       resolver:resolve
                                                       rejecter:reject];
}

RCT_EXPORT_METHOD(debugSetBatchSize : (NSInteger)size resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift debugSetBatchSizeWithSize:size
                                            resolver:resolve
                                            rejecter:reject];
}

RCT_EXPORT_METHOD(debugSetFlushInterval : (double)interval resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift debugSetFlushIntervalWithInterval:interval
                                                    resolver:resolve
                                                    rejecter:reject];
}

RCT_EXPORT_METHOD(
    debugSimulateServerConfig : (NSInteger)batchSize flushInterval : (double)
        flushInterval ttl : (double)ttl strategy : (NSString *)
            strategy resolver : (RCTPromiseResolveBlock)
                resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift debugSimulateServerConfigWithBatchSize:batchSize
                                                    flushInterval:flushInterval
                                                              ttl:ttl
                                                         strategy:strategy
                                                         resolver:resolve
                                                         rejecter:reject];
}

RCT_EXPORT_METHOD(debugResetConfig : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift debugResetConfigWithResolver:resolve
                                               rejecter:reject];
}

RCT_EXPORT_METHOD(debugPrintConfig : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift debugPrintConfigWithResolver:resolve
                                               rejecter:reject];
}

RCT_EXPORT_METHOD(debugGetConfig : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [LinkzlyReactNativeSwift debugGetConfigWithResolver:resolve rejecter:reject];
}

@end
