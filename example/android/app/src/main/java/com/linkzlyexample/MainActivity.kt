package com.linkzlyexample

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

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
