---
title: "Android / Swift Integration"
description: "Native Android and iOS WebView integration"
category: "code-samples"
order: 3
---

Integrate OnArrival's PWA using native WebView components.

---

## Android (Kotlin)

### Setup

Add WebView to your layout:

```xml
<!-- activity_webview.xml -->
<WebView
    android:id="@+id/webView"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

### Implementation

```kotlin
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.JavascriptInterface
import org.json.JSONObject

class OnArrivalActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_webview)

        webView = findViewById(R.id.webView)
        setupWebView()
    }

    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            loadWithOverviewMode = true
            useWideViewPort = true
        }

        // Add JavaScript interface
        webView.addJavascriptInterface(
            OnArrivalBridge(this),
            "AndroidBridge"
        )

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                injectBridgeScript()
            }
        }

        webView.loadUrl("https://your-org.onarrival.travel")
    }

    private fun injectBridgeScript() {
        val script = """
            (function() {
                window.eventLogin = function() {
                    return new Promise(resolve => {
                        AndroidBridge.eventLogin();
                        window.__loginCallback = resolve;
                    });
                };

                window.eventCoin = function() {
                    return new Promise(resolve => {
                        AndroidBridge.eventCoin();
                        window.__coinCallback = resolve;
                    });
                };

                window.eventPaymentGateway = function(payload) {
                    return new Promise(resolve => {
                        AndroidBridge.eventPaymentGateway(JSON.stringify(payload));
                        window.__paymentCallback = resolve;
                    });
                };

                window.back = function() {
                    AndroidBridge.back();
                };
            })();
        """.trimIndent()

        webView.evaluateJavascript(script, null)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.evaluateJavascript("window.oaBack();", null)
        } else {
            super.onBackPressed()
        }
    }
}
```

### JavaScript Bridge Class

```kotlin
class OnArrivalBridge(private val activity: OnArrivalActivity) {

    @JavascriptInterface
    fun eventLogin() {
        val loginInfo = JSONObject().apply {
            put("id", getUserId())
            put("token", getAuthToken())
        }

        activity.runOnUiThread {
            activity.webView.evaluateJavascript(
                "window.__loginCallback($loginInfo);",
                null
            )
        }
    }

    @JavascriptInterface
    fun eventCoin() {
        val coinData = JSONObject().apply {
            put("coinsBalance", getCoinBalance())
        }

        activity.runOnUiThread {
            activity.webView.evaluateJavascript(
                "window.__coinCallback($coinData);",
                null
            )
        }
    }

    @JavascriptInterface
    fun eventPaymentGateway(payloadJson: String) {
        val payload = JSONObject(payloadJson)

        // Initialize your payment gateway
        PaymentGateway.startPayment(
            activity,
            payload,
            object : PaymentCallback {
                override fun onSuccess(result: PaymentResult) {
                    val response = JSONObject().apply {
                        put("status", "SUCCESS")
                        put("data", JSONObject().apply {
                            put("transactionId", result.transactionId)
                        })
                    }
                    sendPaymentResult(response)
                }

                override fun onFailure(error: String) {
                    val response = JSONObject().apply {
                        put("status", "FAILED")
                        put("data", JSONObject().apply {
                            put("error", error)
                        })
                    }
                    sendPaymentResult(response)
                }
            }
        )
    }

    @JavascriptInterface
    fun back() {
        activity.finish()
    }

    private fun sendPaymentResult(response: JSONObject) {
        activity.runOnUiThread {
            activity.webView.evaluateJavascript(
                "window.__paymentCallback($response);",
                null
            )
        }
    }
}
```

---

## iOS (Swift)

### Implementation

```swift
import UIKit
import WebKit

class OnArrivalViewController: UIViewController {
    private var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
    }

    private func setupWebView() {
        let config = WKWebViewConfiguration()
        let contentController = WKUserContentController()

        // Add message handlers
        contentController.add(self, name: "eventLogin")
        contentController.add(self, name: "eventCoin")
        contentController.add(self, name: "eventPaymentGateway")
        contentController.add(self, name: "back")

        config.userContentController = contentController

        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        view.addSubview(webView)

        let url = URL(string: "https://your-org.onarrival.travel")!
        webView.load(URLRequest(url: url))
    }

    private func injectBridgeScript() {
        let script = """
            (function() {
                window.eventLogin = function() {
                    return new Promise(resolve => {
                        window.__loginCallback = resolve;
                        window.webkit.messageHandlers.eventLogin.postMessage({});
                    });
                };

                window.eventCoin = function() {
                    return new Promise(resolve => {
                        window.__coinCallback = resolve;
                        window.webkit.messageHandlers.eventCoin.postMessage({});
                    });
                };

                window.eventPaymentGateway = function(payload) {
                    return new Promise(resolve => {
                        window.__paymentCallback = resolve;
                        window.webkit.messageHandlers.eventPaymentGateway.postMessage(payload);
                    });
                };

                window.back = function() {
                    window.webkit.messageHandlers.back.postMessage({});
                };
            })();
        """

        webView.evaluateJavaScript(script, completionHandler: nil)
    }
}

extension OnArrivalViewController: WKScriptMessageHandler {
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        switch message.name {
        case "eventLogin":
            handleLogin()

        case "eventCoin":
            handleCoinBalance()

        case "eventPaymentGateway":
            if let payload = message.body as? [String: Any] {
                handlePayment(payload: payload)
            }

        case "back":
            navigationController?.popViewController(animated: true)

        default:
            break
        }
    }

    private func handleLogin() {
        let loginInfo: [String: Any] = [
            "id": getUserId(),
            "token": getAuthToken()
        ]

        let jsonData = try! JSONSerialization.data(withJSONObject: loginInfo)
        let jsonString = String(data: jsonData, encoding: .utf8)!

        webView.evaluateJavaScript(
            "window.__loginCallback(\(jsonString));",
            completionHandler: nil
        )
    }

    private func handleCoinBalance() {
        let coinData: [String: Any] = ["coinsBalance": getCoinBalance()]
        let jsonData = try! JSONSerialization.data(withJSONObject: coinData)
        let jsonString = String(data: jsonData, encoding: .utf8)!

        webView.evaluateJavaScript(
            "window.__coinCallback(\(jsonString));",
            completionHandler: nil
        )
    }

    private func handlePayment(payload: [String: Any]) {
        // Initialize your payment gateway
        PaymentGateway.startPayment(payload) { result in
            let response: [String: Any]

            switch result {
            case .success(let data):
                response = [
                    "status": "SUCCESS",
                    "data": ["transactionId": data.transactionId]
                ]
            case .failure(let error):
                response = [
                    "status": "FAILED",
                    "data": ["error": error.localizedDescription]
                ]
            }

            let jsonData = try! JSONSerialization.data(withJSONObject: response)
            let jsonString = String(data: jsonData, encoding: .utf8)!

            DispatchQueue.main.async {
                self.webView.evaluateJavaScript(
                    "window.__paymentCallback(\(jsonString));",
                    completionHandler: nil
                )
            }
        }
    }
}

extension OnArrivalViewController: WKNavigationDelegate {
    func webView(
        _ webView: WKWebView,
        didFinish navigation: WKNavigation!
    ) {
        injectBridgeScript()
    }
}
```

{% callout type="tip" %}
For production apps, consider implementing WKWebView caching and preloading strategies for optimal performance.
{% /callout %}
