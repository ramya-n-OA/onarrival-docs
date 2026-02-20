---
title: "Flutter Integration"
description: "Flutter WebView integration with JavaScript bridge"
category: "code-samples"
order: 1
---

This Flutter application integrates OnArrival's flight booking web interface using `InAppWebView`. It leverages a bridge between JavaScript events from the webview and native Dart callbacks.

---

## Setup

Add the `flutter_inappwebview` package to your `pubspec.yaml`:

```yaml
dependencies:
  flutter_inappwebview: ^6.0.0
```

---

## Basic Implementation

```dart
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'dart:convert';

class OnArrivalWebView extends StatefulWidget {
  @override
  _OnArrivalWebViewState createState() => _OnArrivalWebViewState();
}

class _OnArrivalWebViewState extends State<OnArrivalWebView> {
  InAppWebViewController? webViewController;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: InAppWebView(
        initialUrlRequest: URLRequest(
          url: Uri.parse('https://your-org.onarrival.travel')
        ),
        onWebViewCreated: (controller) {
          webViewController = controller;
          _setupJavaScriptHandlers(controller);
        },
        onLoadStop: (controller, url) async {
          // Optional: Handle page load complete
        },
      ),
    );
  }

  void _setupJavaScriptHandlers(InAppWebViewController controller) {
    // Handle login requests
    controller.addJavaScriptHandler(
      handlerName: 'eventLogin',
      callback: (args) async {
        final loginInfo = await getUserLoginInfo();
        return loginInfo;
      },
    );

    // Handle coin balance requests
    controller.addJavaScriptHandler(
      handlerName: 'eventCoin',
      callback: (args) async {
        final coinBalance = await getCoinBalance();
        return coinBalance;
      },
    );

    // Handle payment gateway
    controller.addJavaScriptHandler(
      handlerName: 'eventPaymentGateway',
      callback: (args) async {
        final paymentResponse = await processPayment(args[0]);
        return paymentResponse;
      },
    );

    // Handle hardware back button
    controller.addJavaScriptHandler(
      handlerName: 'oaBack',
      callback: (args) {
        controller.evaluateJavascript(source: 'window.oaBack();');
      },
    );

    // Handle URL opening
    controller.addJavaScriptHandler(
      handlerName: 'eventOpenUrl',
      callback: (args) {
        final url = args[0] as String;
        // Open URL in browser
        launchUrl(Uri.parse(url));
      },
    );

    // Handle file downloads
    controller.addJavaScriptHandler(
      handlerName: 'eventDownload',
      callback: (args) {
        final url = args[0] as String;
        // Trigger download
        downloadFile(url);
      },
    );
  }
}
```

---

## Helper Functions

```dart
Future<int> getCoinBalance() async {
  // Fetch coin balance from your backend
  return 500; // Example balance
}

Future<Map<String, dynamic>> getUserLoginInfo() async {
  // Fetch from secure storage or auth service
  return {
    "id": "user_123",
    "token": "your_jwt_token_here",
  };
}

Future<Map<String, dynamic>> processPayment(
  Map<String, dynamic> paymentData
) async {
  // Initialize your payment gateway SDK
  // Process payment and return result

  try {
    final result = await YourPaymentGateway.process(paymentData);

    return {
      "status": "SUCCESS",
      "data": {
        "transactionId": result.transactionId,
        "amountPaid": result.amount,
      }
    };
  } catch (e) {
    return {
      "status": "FAILED",
      "data": {
        "error": e.toString(),
      }
    };
  }
}
```

---

## Sending Data to PWA

To send data from native to the PWA:

```dart
// Navigate to a specific route
await webViewController?.evaluateJavascript(
  source: 'window.oa_client_redirect_to("/my-bookings")'
);

// Send user login info
await webViewController?.evaluateJavascript(
  source: 'window.eventLogin(${jsonEncode(userInfo)})'
);
```

---

## Handling Navigation

```dart
// Handle back navigation
@override
Future<bool> onWillPop() async {
  if (await webViewController?.canGoBack() ?? false) {
    webViewController?.goBack();
    return false;
  }
  return true;
}
```

{% callout type="tip" %}
Maintain the WebView instance as a singleton throughout the user session for optimal performance.
{% /callout %}
