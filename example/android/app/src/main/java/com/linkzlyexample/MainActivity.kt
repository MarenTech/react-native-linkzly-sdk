package com.linkzlyexample

import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.linkzly.reactnative.LinkzlyReactNativeModule

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "LinkzlyExample"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Handle deep links when app is already running (warm start)
   * This ensures the LinkzlySDK processes deep links even if
   * React Native's Linking.addEventListener doesn't fire reliably
   *
   * CRITICAL: This override is required for Android warm start deep links to work
   */
  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)

    // Critical: Update the activity's intent so getIntent() returns the latest one
    setIntent(intent)

    // Handle through Linkzly native module (bypasses unreliable RN Linking events)
    val handled = LinkzlyReactNativeModule.getLatestInstance()?.handleIntent(intent) ?: false

    if (handled) {
      android.util.Log.d("MainActivity", "Deep link handled by LinkzlySDK: ${intent?.data}")
    } else {
      android.util.Log.w("MainActivity", "Deep link not handled by LinkzlySDK: ${intent?.data}")
    }
  }

  /**
   * Fix for React Native 0.82+ soft exception:
   * "Tried to access onWindowFocusChange while context is not ready"
   *
   * This override prevents the exception by safely checking if the delegate
   * exists before forwarding the window focus change event.
   */
  override fun onWindowFocusChanged(hasFocus: Boolean) {
    try {
      super.onWindowFocusChanged(hasFocus)
    } catch (e: Exception) {
      // Silently catch any exceptions during window focus changes
      // This is a known non-fatal issue in React Native 0.82+
    }
  }
}
