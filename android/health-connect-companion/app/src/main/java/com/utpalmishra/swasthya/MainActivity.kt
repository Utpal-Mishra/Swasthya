package com.utpalmishra.swasthya

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * Prototype Android bridge for the optional My Health page.
 *
 * It reads only permissions the user grants, derives a compact summary on-device,
 * and injects that summary into the Swasthya WebView. Raw Health Connect records
 * are never uploaded by this class.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var healthClient: HealthConnectClient? = null
    private var pageReady = false

    private val permissions = HealthSnapshotReader.permissions

    private val permissionLauncher = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) { granted ->
        if (granted.isEmpty()) {
            sendNativeStatus("Permission not granted. Wearable context remains disconnected.", "warning")
        } else {
            readAndPush(granted)
        }
    }

    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            addJavascriptInterface(NativeBridge(), "SwasthyaNative")
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    pageReady = true
                    sendNativeStatus("Android companion ready. Tap Connect Health Connect to grant access.", "ready")
                }

                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val uri = request?.url ?: return false
                    val trusted = uri.scheme == "https" &&
                        uri.host == "utpal-mishra.github.io" &&
                        uri.path.orEmpty().startsWith("/Swasthya/")
                    if (trusted) return false
                    startActivity(Intent(Intent.ACTION_VIEW, uri))
                    return true
                }
            }
        }
        setContentView(webView)
        webView.loadUrl("https://utpal-mishra.github.io/Swasthya/dashboard.html")

        when (HealthConnectClient.getSdkStatus(this)) {
            HealthConnectClient.SDK_AVAILABLE -> healthClient = HealthConnectClient.getOrCreate(this)
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED ->
                sendNativeStatus("Health Connect needs to be installed or updated before wearable data can be read.", "warning")
            else -> sendNativeStatus("Health Connect is not available on this device.", "warning")
        }
    }

    private fun requestOrRead() {
        val client = healthClient ?: run {
            sendNativeStatus("Health Connect is not available. Check Android Health Connect settings.", "warning")
            return
        }
        lifecycleScope.launch {
            val granted = client.permissionController.getGrantedPermissions()
            if (granted.containsAll(permissions)) readAndPush(granted)
            else permissionLauncher.launch(permissions)
        }
    }

    private fun readAndPush(granted: Set<String>) {
        val client = healthClient ?: return
        lifecycleScope.launch {
            runCatching { HealthSnapshotReader(client).readSummary(granted) }
                .onSuccess { summary ->
                    val encoded = JSONObject.quote(summary.toString())
                    evaluate("window.SwasthyaWearableBridge?.receiveSnapshot($encoded);")
                    sendNativeStatus("Health Connect summary refreshed on-device.", "connected")
                }
                .onFailure { error ->
                    sendNativeStatus("Could not read the available Health Connect data: ${error.message ?: "unknown error"}", "warning")
                }
        }
    }

    private fun sendNativeStatus(message: String, state: String) {
        val js = "window.SwasthyaWearableBridge?.receiveNativeStatus(${JSONObject.quote(message)},${JSONObject.quote(state)});"
        evaluate(js)
    }

    private fun evaluate(script: String) {
        if (!pageReady) return
        webView.post { webView.evaluateJavascript(script, null) }
    }

    inner class NativeBridge {
        @JavascriptInterface
        fun requestHealthConnect() {
            runOnUiThread { requestOrRead() }
        }
    }

    override fun onDestroy() {
        webView.removeJavascriptInterface("SwasthyaNative")
        webView.destroy()
        super.onDestroy()
    }
}
