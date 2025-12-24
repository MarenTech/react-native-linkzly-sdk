require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "linkzly-react-native-sdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "12.0" }
  s.source       = { :git => "https://github.com/MarenTech/react-native-linkzly-sdk.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  # Include both the main header and the umbrella header
  s.public_header_files = "ios/LinkzlyReactNative.h", "ios/linkzly_react_native_sdk/linkzly_react_native_sdk.h"
  # Preserve the directory structure for the umbrella header
  s.preserve_paths = "ios/linkzly_react_native_sdk"

  # Support React Native >= 0.71.2
  # Using install_modules_dependencies for RN 0.71+ compatibility
  if defined?(install_modules_dependencies()) != nil
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end

  # Swift/Objective-C interop configuration for React Native modules
  s.pod_target_xcconfig = {
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'SWIFT_OBJC_INTERFACE_HEADER_NAME' => 'LinkzlyReactNative-Swift.h',
    'SWIFT_INSTALL_OBJC_HEADER' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES' => 'YES',
    'HEADER_SEARCH_PATHS' => '$(inherited) "${PODS_ROOT}/Headers/Public" "${PODS_ROOT}/Headers/Public/linkzly-react-native-sdk" "${PODS_ROOT}/Headers/Public/linkzly-react-native-sdk/linkzly_react_native_sdk" "$(PODS_TARGET_SRCROOT)/ios" "$(PODS_TARGET_SRCROOT)/ios/linkzly_react_native_sdk"'
  }
  
  # Ensure Swift header is included in public headers
  s.public_header_files = "ios/LinkzlyReactNative.h", "ios/linkzly_react_native_sdk/linkzly_react_native_sdk.h"

  # ============================================================
  # LinkzlySDK Dependency Configuration
  # ============================================================
  # The iOS SDK is installed from GitHub in your app's Podfile.
  # Add this to your Podfile BEFORE use_native_modules!:
  # pod 'LinkzlySDK', :git => 'https://github.com/MarenTech/ios-linkzly.git', :tag => '1.0.0'
  # 
  # For local development, use:
  # pod 'LinkzlySDK', :path => '../path/to/linkzly-ios-sdk'
  # ============================================================
  
  # This dependency will be resolved from the Podfile
  # Users must add LinkzlySDK to their Podfile (see README.md)
  s.dependency "LinkzlySDK", "~> 1.0.0"

  # ============================================================

  s.swift_version = "5.0"
end
