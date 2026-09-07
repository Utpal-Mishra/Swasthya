# Swasthya Health Connect companion

This folder contains the first Android bridge prototype for Swasthya's optional **My Health** layer.

## Why Health Connect first

Samsung Health can synchronize Galaxy Watch data to Health Connect after the user grants permissions. Building the first bridge on Health Connect gives Swasthya an Android interoperability layer instead of locking the product to one wearable vendor.

```text
Galaxy Watch / other supported wearable
        ↓
Samsung Health / compatible Android health app
        ↓
Health Connect
        ↓
Swasthya Android companion
        ↓
derived daily summary only
        ↓
My Health WebView
```

The companion requests read access only for:

- steps
- heart rate
- resting heart rate
- sleep sessions
- oxygen saturation
- HRV RMSSD

The user can grant or deny each permission. Missing data remains unavailable rather than being estimated.

## Current behaviour

The app opens the Swasthya `dashboard.html` page in a restricted WebView. External links open outside the WebView. When the user taps **Connect Health Connect**, Android presents the Health Connect permission screen.

The companion then derives a compact summary on-device for the last 24 hours and a 14-day personal baseline where supported. Raw Health Connect records are not sent to a Swasthya backend by this prototype.

The summary is injected into:

```js
window.SwasthyaWearableBridge.receiveSnapshot(json)
```

and is held only in the page's browser session.

## Build

Open `android/health-connect-companion` in Android Studio, sync Gradle and run on a physical Android device with Health Connect available.

Requirements used by the prototype:

- Android SDK 36
- minSdk 28
- JDK 17
- AndroidX Health Connect `1.1.0`

For Samsung Health data, enable Samsung Health → Settings → Health Connect and grant Samsung Health permission to share the relevant data types.

## Important limitations

- This is a development prototype, not a distributed APK.
- Health Connect data availability depends on what the source app actually synchronizes. A Health Connect record type existing does not mean Samsung Health will populate it on every device.
- Samsung Energy Score and some Samsung-specific measurements are not assumed to be available through Health Connect. A later Samsung Health Data SDK adapter can add them after Samsung distribution/partnership requirements are addressed.
- High-frequency raw Galaxy Watch sensors such as IBI/PPG/EDA should use the Samsung Health Sensor SDK only for a clearly justified feature.
- The current WebView loads the public GitHub Pages frontend. Before handling persistent sensitive histories commercially, bundle/sign the frontend or move the UI native so wearable data cannot be exposed to a remotely changeable page.
- Swasthya uses wearable data for wellness context and personal associations, not to diagnose a mental-health condition or infer a user's emotion as fact.
