---
title: "React Native Integration"
description: "React Native WebView integration with JavaScript bridge"
category: "code-samples"
order: 2
---

Integrate OnArrival's flight booking experience in React Native using `react-native-webview`.

---

## Setup

Install the WebView package:

```bash
npm install react-native-webview
# or
yarn add react-native-webview
```

For iOS, install pods:

```bash
cd ios && pod install
```

---

## Basic Implementation

```tsx
import React, { useRef, useCallback } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { BackHandler, Platform } from 'react-native';

const OnArrivalWebView: React.FC = () => {
  const webViewRef = useRef<WebView>(null);

  // Handle messages from PWA
  const onMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      const { type, payload, callbackId } = message;

      let response: any;

      switch (type) {
        case 'eventLogin':
          response = await getUserLoginInfo();
          break;

        case 'eventCoin':
          response = await getCoinBalance();
          break;

        case 'eventPaymentGateway':
          response = await processPayment(payload);
          break;

        case 'eventOpenUrl':
          await openUrl(payload.url);
          break;

        case 'eventDownload':
          await downloadFile(payload.url);
          break;

        case 'back':
          handleBack();
          break;

        default:
          console.warn('Unknown event type:', type);
      }

      // Send response back to PWA
      if (callbackId && response) {
        const script = `
          window.__oaCallbacks['${callbackId}'](${JSON.stringify(response)});
        `;
        webViewRef.current?.injectJavaScript(script);
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }, []);

  // Injected JavaScript for bridge setup
  const injectedJavaScript = `
    (function() {
      window.__oaCallbacks = {};
      let callbackId = 0;

      function createBridgeMethod(name) {
        return function(payload) {
          return new Promise((resolve) => {
            const id = 'cb_' + (callbackId++);
            window.__oaCallbacks[id] = resolve;

            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: name,
              payload: payload,
              callbackId: id
            }));
          });
        };
      }

      window.eventLogin = createBridgeMethod('eventLogin');
      window.eventCoin = createBridgeMethod('eventCoin');
      window.eventPaymentGateway = createBridgeMethod('eventPaymentGateway');
      window.eventOpenUrl = createBridgeMethod('eventOpenUrl');
      window.eventDownload = createBridgeMethod('eventDownload');
      window.back = createBridgeMethod('back');

      true;
    })();
  `;

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: 'https://your-org.onarrival.travel' }}
      onMessage={onMessage}
      injectedJavaScript={injectedJavaScript}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      allowsBackForwardNavigationGestures={true}
    />
  );
};

export default OnArrivalWebView;
```

---

## Helper Functions

```tsx
// Get user login info from secure storage
async function getUserLoginInfo(): Promise<object> {
  const token = await SecureStore.getItemAsync('auth_token');
  const userId = await SecureStore.getItemAsync('user_id');

  return {
    id: userId,
    token: token,
  };
}

// Get coin balance from your API
async function getCoinBalance(): Promise<object> {
  const response = await fetch('https://your-api.com/coins');
  const data = await response.json();

  return {
    coinsBalance: data.balance,
  };
}

// Process payment with your gateway
async function processPayment(payload: any): Promise<object> {
  try {
    // Initialize your payment SDK (Razorpay, Juspay, etc.)
    const result = await PaymentGateway.open({
      orderId: payload.orderId,
      amount: payload.amount,
      currency: payload.currency,
    });

    return {
      status: 'SUCCESS',
      data: {
        transactionId: result.transactionId,
        amountPaid: result.amount,
      },
    };
  } catch (error: any) {
    return {
      status: 'FAILED',
      data: {
        error: error.message,
      },
    };
  }
}

// Open URL in browser
async function openUrl(url: string): Promise<void> {
  await Linking.openURL(url);
}

// Download file
async function downloadFile(url: string): Promise<void> {
  // Use react-native-fs or similar for downloads
  const downloadDest = `${RNFS.DocumentDirectoryPath}/${filename}`;
  await RNFS.downloadFile({ fromUrl: url, toFile: downloadDest });
}
```

---

## Handling Hardware Back Button

```tsx
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

useEffect(() => {
  const backHandler = BackHandler.addEventListener(
    'hardwareBackPress',
    () => {
      // Notify PWA about back button press
      webViewRef.current?.injectJavaScript('window.oaBack();');
      return true;
    }
  );

  return () => backHandler.remove();
}, []);
```

---

## Deep Linking

```tsx
// Navigate PWA to specific route
function navigateTo(route: string) {
  webViewRef.current?.injectJavaScript(
    `window.oa_client_redirect_to('${route}');`
  );
}

// Usage
navigateTo('/my-bookings');
navigateTo('/booking-status/ORDER123');
```

{% callout type="warning" %}
Ensure `javaScriptEnabled` is set to `true` for the bridge to work correctly.
{% /callout %}
