'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Shield,
  Search,
  CreditCard,
  CheckCircle2,
  Zap,
  ArrowRight,
  Code2,
  Server,
  Smartphone,
  Globe,
  Database,
  Play,
  Pause,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowDown,
  Webhook,
} from 'lucide-react';

// ============================================================================
// TYPES & DATA
// ============================================================================

type ParticipantKey = 'native' | 'bridge' | 'pwa' | 'onarrival' | 'partner';

interface Participant {
  name: string;
  short: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  text: string;
  glow: string;
  icon: React.ElementType;
}

interface FlowStep {
  from: ParticipantKey;
  to: ParticipantKey;
  label: string;
  type: 'request' | 'response' | 'event' | 'callback' | 'webhook';
  description?: string;
  code?: string;
}

interface Phase {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  steps: FlowStep[];
  description: string;
}

// Participant definitions
const participants: Record<ParticipantKey, Participant> = {
  native: {
    name: 'Native App',
    short: 'Native',
    description: 'iOS/Android host application',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    glow: 'shadow-rose-500/20',
    icon: Smartphone,
  },
  bridge: {
    name: 'JS Bridge',
    short: 'Bridge',
    description: 'WebView ↔ Native communication layer',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    glow: 'shadow-violet-500/20',
    icon: Zap,
  },
  pwa: {
    name: 'PWA',
    short: 'PWA',
    description: 'OnArrival booking interface',
    color: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
    icon: Globe,
  },
  onarrival: {
    name: 'OnArrival API',
    short: 'OnArrival',
    description: 'Flight booking orchestration',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    icon: Server,
  },
  partner: {
    name: 'Partner Backend',
    short: 'Partner',
    description: 'Your server infrastructure',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    icon: Database,
  },
};

// Phase definitions with detailed steps
const phases: Phase[] = [
  {
    id: 'auth',
    title: 'Authentication',
    subtitle: 'Session & Identity',
    icon: Shield,
    color: 'emerald',
    description: 'Establish user identity via JWT validation and fetch profile context through S2S APIs.',
    steps: [
      {
        from: 'native',
        to: 'bridge',
        label: 'eventLogin()',
        type: 'event',
        description: 'Native app triggers login with user credentials',
        code: `// Native app calls JS Bridge
window.JSBridge.eventLogin({
  jwt: "eyJhbGciOiJSUzI1NiIs...",
  userId: "usr_12345",
  deviceId: "device_abc123"
});`,
      },
      {
        from: 'bridge',
        to: 'pwa',
        label: 'Initialize Session',
        type: 'request',
        description: 'PWA receives credentials and starts session',
        code: `// PWA session initialization
const session = await initSession({
  token: credentials.jwt,
  userId: credentials.userId
});`,
      },
      {
        from: 'pwa',
        to: 'onarrival',
        label: 'POST /auth/validate',
        type: 'request',
        description: 'Validate JWT with OnArrival backend',
        code: `POST /api/v1/auth/validate
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "deviceId": "device_abc123",
  "platform": "android"
}`,
      },
      {
        from: 'onarrival',
        to: 'partner',
        label: 'GET /user/profile',
        type: 'request',
        description: 'Fetch user profile via S2S API',
        code: `GET /s2s/api/v1/user/profile
x-api-key: <PARTNER_API_KEY>
x-user-id: usr_12345
Content-Type: application/json`,
      },
      {
        from: 'partner',
        to: 'onarrival',
        label: 'User Profile Response',
        type: 'response',
        description: 'Return user details for personalization',
        code: `{
  "userId": "usr_12345",
  "email": "user@example.com",
  "tier": "gold",
  "walletBalance": 15000,
  "coinsBalance": 2500
}`,
      },
    ],
  },
  {
    id: 'search',
    title: 'Search & Select',
    subtitle: 'Flights & Ancillaries',
    icon: Search,
    color: 'blue',
    description: 'Multi-supplier aggregation with real-time fare comparison and ancillary selection.',
    steps: [
      {
        from: 'bridge',
        to: 'native',
        label: 'eventLocation()',
        type: 'event',
        description: 'Request device location for nearby airports',
        code: `// Request location permission and coordinates
window.JSBridge.eventLocation({
  purpose: "nearest_airport",
  highAccuracy: true
});`,
      },
      {
        from: 'native',
        to: 'bridge',
        label: 'Location Callback',
        type: 'callback',
        description: 'Native returns GPS coordinates',
        code: `// Callback with location data
{
  "latitude": 19.0760,
  "longitude": 72.8777,
  "accuracy": 10,
  "nearestAirport": "BOM"
}`,
      },
      {
        from: 'pwa',
        to: 'onarrival',
        label: 'POST /flights/search',
        type: 'request',
        description: 'Search flights across all suppliers',
        code: `POST /api/v1/flights/search
Authorization: Bearer <JWT>

{
  "origin": "BOM",
  "destination": "DEL",
  "departDate": "2025-02-15",
  "passengers": { "adults": 2, "children": 1 },
  "cabinClass": "economy"
}`,
      },
      {
        from: 'onarrival',
        to: 'pwa',
        label: 'Aggregated Results',
        type: 'response',
        description: 'Combined results from multiple suppliers',
        code: `{
  "searchId": "srch_abc123",
  "flights": [
    {
      "flightId": "flt_001",
      "airline": "6E",
      "price": 5500,
      "duration": "2h 10m"
    }
  ],
  "filters": { ... }
}`,
      },
      {
        from: 'pwa',
        to: 'onarrival',
        label: 'GET /flights/{id}/ancillaries',
        type: 'request',
        description: 'Fetch available add-ons (meals, seats, baggage)',
        code: `GET /api/v1/flights/flt_001/ancillaries
Authorization: Bearer <JWT>`,
      },
    ],
  },
  {
    id: 'payment',
    title: 'Payment',
    subtitle: 'Gateway Integration',
    icon: CreditCard,
    color: 'violet',
    description: 'Initialize payment via S2S, trigger native SDK, and verify transaction status.',
    steps: [
      {
        from: 'pwa',
        to: 'onarrival',
        label: 'POST /booking/init',
        type: 'request',
        description: 'Lock fare and create booking hold',
        code: `POST /api/v1/booking/init
Authorization: Bearer <JWT>

{
  "flightId": "flt_001",
  "passengers": [...],
  "ancillaries": ["meal_veg", "seat_12A"],
  "contactInfo": { ... }
}`,
      },
      {
        from: 'onarrival',
        to: 'partner',
        label: 'POST /payment/init',
        type: 'request',
        description: 'Initialize payment on partner backend',
        code: `POST /s2s/api/v1/payment/init
x-api-key: <PARTNER_API_KEY>

{
  "orderId": "ORD_123456",
  "amount": 16500,
  "currency": "INR",
  "userId": "usr_12345",
  "useCoins": 2500
}`,
      },
      {
        from: 'partner',
        to: 'onarrival',
        label: 'Gateway Metadata',
        type: 'response',
        description: 'Return payment gateway initialization data',
        code: `{
  "transactionId": "txn_789",
  "gatewayOrderId": "pg_order_xyz",
  "gatewayConfig": {
    "key": "rzp_live_xxx",
    "amount": 14000,
    "currency": "INR"
  }
}`,
      },
      {
        from: 'bridge',
        to: 'native',
        label: 'eventPaymentGateway()',
        type: 'event',
        description: 'Trigger native payment SDK',
        code: `// Trigger native payment flow
window.JSBridge.eventPaymentGateway({
  gateway: "razorpay",
  orderId: "pg_order_xyz",
  amount: 14000,
  prefill: {
    email: "user@example.com",
    contact: "9876543210"
  }
});`,
      },
      {
        from: 'native',
        to: 'bridge',
        label: 'Payment Result',
        type: 'callback',
        description: 'Native returns payment outcome',
        code: `// Success callback
{
  "status": "SUCCESS",
  "paymentId": "pay_abc123",
  "orderId": "pg_order_xyz",
  "signature": "sig_xyz..."
}

// Failure callback
{
  "status": "FAILED",
  "errorCode": "PAYMENT_CANCELLED",
  "errorMessage": "User cancelled payment"
}`,
      },
    ],
  },
  {
    id: 'confirm',
    title: 'Confirmation',
    subtitle: 'Booking & Delivery',
    icon: CheckCircle2,
    color: 'amber',
    description: 'Confirm booking, generate PNR, deliver e-ticket, and trigger lifecycle webhooks.',
    steps: [
      {
        from: 'pwa',
        to: 'onarrival',
        label: 'POST /booking/confirm',
        type: 'request',
        description: 'Confirm booking with payment proof',
        code: `POST /api/v1/booking/confirm
Authorization: Bearer <JWT>

{
  "bookingId": "bkg_123",
  "paymentId": "pay_abc123",
  "signature": "sig_xyz..."
}`,
      },
      {
        from: 'onarrival',
        to: 'partner',
        label: 'Webhook: PAYMENT_COMPLETED',
        type: 'webhook',
        description: 'Notify partner of successful payment',
        code: `POST /your-webhook-endpoint
x-webhook-signature: sha256=abc123...

{
  "event": "PAYMENT_COMPLETED",
  "timestamp": "2025-01-20T10:30:00Z",
  "data": {
    "orderId": "ORD_123456",
    "transactionId": "txn_789",
    "amount": 16500,
    "status": "SUCCESS"
  }
}`,
      },
      {
        from: 'onarrival',
        to: 'pwa',
        label: 'Booking Confirmed',
        type: 'response',
        description: 'Return PNR and booking details',
        code: `{
  "bookingId": "bkg_123",
  "pnr": "ABC123",
  "status": "CONFIRMED",
  "ticketUrl": "https://..../ticket.pdf",
  "flights": [...],
  "passengers": [...]
}`,
      },
      {
        from: 'bridge',
        to: 'native',
        label: 'eventDownload()',
        type: 'event',
        description: 'Download e-ticket to device',
        code: `// Trigger native download
window.JSBridge.eventDownload({
  url: "https://.../ticket.pdf",
  filename: "ticket_ABC123.pdf",
  mimeType: "application/pdf"
});`,
      },
      {
        from: 'onarrival',
        to: 'partner',
        label: 'Webhook: BOOKING_CONFIRMED',
        type: 'webhook',
        description: 'Final confirmation webhook with PNR',
        code: `POST /your-webhook-endpoint
x-webhook-signature: sha256=def456...

{
  "event": "BOOKING_CONFIRMED",
  "timestamp": "2025-01-20T10:30:05Z",
  "data": {
    "orderId": "ORD_123456",
    "bookingId": "bkg_123",
    "pnr": "ABC123",
    "ticketUrl": "https://..."
  }
}`,
      },
    ],
  },
];

const typeStyles: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  request: { color: 'bg-blue-500', label: 'Request', icon: ArrowRight },
  response: { color: 'bg-emerald-500', label: 'Response', icon: ArrowRight },
  event: { color: 'bg-violet-500', label: 'JS Event', icon: Zap },
  callback: { color: 'bg-amber-500', label: 'Callback', icon: ArrowRight },
  webhook: { color: 'bg-pink-500', label: 'Webhook', icon: Webhook },
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-400" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400" />
      )}
    </button>
  );
}

// ============================================================================
// ARCHITECTURE DIAGRAM
// ============================================================================

function ArchitectureDiagram() {
  return (
    <div className="rounded-2xl bg-gray-900/50 border border-gray-800 p-6 lg:p-8">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-6">
        <Layers className="w-5 h-5 text-cyan-400" />
        System Architecture
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-2">
        {/* Native App */}
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-full p-4 rounded-xl border-2 text-center",
            participants.native.bg,
            participants.native.border
          )}>
            <Smartphone className={cn("w-8 h-8 mx-auto mb-2", participants.native.text)} />
            <div className="font-semibold text-white text-sm">Native App</div>
            <div className="text-xs text-gray-500 mt-1">iOS / Android</div>
          </div>
          <ArrowDown className="w-5 h-5 text-gray-600 my-2 lg:hidden" />
        </div>

        {/* Arrow */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 bg-gradient-to-r from-rose-500 to-violet-500" />
            <ChevronRight className="w-4 h-4 text-violet-400 -ml-1" />
          </div>
        </div>

        {/* JS Bridge + PWA */}
        <div className="flex flex-col items-center">
          <div className="w-full space-y-2">
            <div className={cn(
              "p-3 rounded-xl border-2 text-center",
              participants.bridge.bg,
              participants.bridge.border
            )}>
              <Zap className={cn("w-6 h-6 mx-auto mb-1", participants.bridge.text)} />
              <div className="font-semibold text-white text-sm">JS Bridge</div>
            </div>
            <div className={cn(
              "p-4 rounded-xl border-2 text-center",
              participants.pwa.bg,
              participants.pwa.border
            )}>
              <Globe className={cn("w-8 h-8 mx-auto mb-2", participants.pwa.text)} />
              <div className="font-semibold text-white text-sm">PWA</div>
              <div className="text-xs text-gray-500 mt-1">WebView</div>
            </div>
          </div>
          <ArrowDown className="w-5 h-5 text-gray-600 my-2 lg:hidden" />
        </div>

        {/* Arrow */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500" />
            <ChevronRight className="w-4 h-4 text-emerald-400 -ml-1" />
          </div>
        </div>

        {/* OnArrival + Partner */}
        <div className="flex flex-col items-center">
          <div className="w-full space-y-2">
            <div className={cn(
              "p-4 rounded-xl border-2 text-center",
              participants.onarrival.bg,
              participants.onarrival.border
            )}>
              <Server className={cn("w-8 h-8 mx-auto mb-2", participants.onarrival.text)} />
              <div className="font-semibold text-white text-sm">OnArrival API</div>
              <div className="text-xs text-gray-500 mt-1">Orchestration</div>
            </div>
            <div className="flex items-center gap-1 justify-center">
              <div className="w-0.5 h-4 bg-gradient-to-b from-emerald-500 to-amber-500" />
            </div>
            <div className={cn(
              "p-4 rounded-xl border-2 text-center",
              participants.partner.bg,
              participants.partner.border
            )}>
              <Database className={cn("w-8 h-8 mx-auto mb-2", participants.partner.text)} />
              <div className="font-semibold text-white text-sm">Partner Backend</div>
              <div className="text-xs text-gray-500 mt-1">Your Server</div>
            </div>
          </div>
        </div>
      </div>

      {/* Communication types */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-6 border-t border-gray-800">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-8 h-0.5 bg-gradient-to-r from-violet-500 to-blue-500 rounded" />
          <span className="text-gray-400">JS Bridge Events</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded" />
          <span className="text-gray-400">REST API (JWT)</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-500 rounded" />
          <span className="text-gray-400">S2S API (API Key)</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PARTICIPANT NODE
// ============================================================================

function ParticipantNode({
  participant,
  isActive,
  showTooltip = false
}: {
  participant: Participant;
  isActive: boolean;
  showTooltip?: boolean;
}) {
  const Icon = participant.icon;

  return (
    <div className={cn(
      "relative flex flex-col items-center gap-2 transition-all duration-300",
      isActive ? "scale-110" : "scale-100 opacity-60"
    )}>
      <div className={cn(
        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
        participant.bg,
        participant.border,
        isActive && `shadow-lg ${participant.glow}`
      )}>
        <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", participant.text)} />
      </div>
      <span className={cn(
        "text-[10px] sm:text-xs font-mono transition-colors duration-300 text-center",
        isActive ? participant.text : "text-gray-500"
      )}>
        {participant.short}
      </span>
      {showTooltip && isActive && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-800 text-xs text-gray-300 whitespace-nowrap">
          {participant.description}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PHASE CARD
// ============================================================================

function PhaseCard({
  phase,
  isActive,
  onClick,
  index,
  progress
}: {
  phase: Phase;
  isActive: boolean;
  onClick: () => void;
  index: number;
  progress?: number;
}) {
  const Icon = phase.icon;
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/25',
    blue: 'from-blue-500 to-cyan-600 shadow-blue-500/25',
    violet: 'from-violet-500 to-purple-600 shadow-violet-500/25',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/25',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-start p-4 sm:p-5 rounded-2xl border transition-all duration-300",
        "hover:scale-[1.02] active:scale-[0.98]",
        isActive
          ? "bg-gray-800/80 border-gray-600 shadow-xl"
          : "bg-gray-900/50 border-gray-800 hover:border-gray-700"
      )}
    >
      {/* Phase number badge */}
      <div className={cn(
        "absolute -top-2.5 -left-2.5 w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white",
        `bg-gradient-to-br ${colorMap[phase.color]}`,
        isActive && "shadow-lg"
      )}>
        {index + 1}
      </div>

      {/* Progress bar */}
      {isActive && progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b-2xl overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300 bg-gradient-to-r", colorMap[phase.color])}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Icon */}
      <div className={cn(
        "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-all duration-300",
        isActive
          ? `bg-gradient-to-br ${colorMap[phase.color]} shadow-lg`
          : "bg-gray-800"
      )}>
        <Icon className={cn(
          "w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300",
          isActive ? "text-white" : "text-gray-400"
        )} />
      </div>

      {/* Content */}
      <h3 className={cn(
        "text-sm font-semibold mb-0.5 transition-colors duration-300",
        isActive ? "text-white" : "text-gray-300"
      )}>
        {phase.title}
      </h3>
      <p className="text-xs text-gray-500">{phase.subtitle}</p>
    </button>
  );
}

// ============================================================================
// FLOW STEP
// ============================================================================

function FlowStepCard({
  step,
  index,
  isActive,
  isAnimating
}: {
  step: FlowStep;
  index: number;
  isActive: boolean;
  isAnimating: boolean;
}) {
  const [showCode, setShowCode] = useState(false);
  const fromParticipant = participants[step.from];
  const toParticipant = participants[step.to];
  const typeStyle = typeStyles[step.type];

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-300",
        isActive
          ? "bg-gray-800/60 border-gray-700"
          : "bg-gray-900/30 border-gray-800/50 opacity-40",
        isAnimating && isActive && "ring-2 ring-cyan-500/50"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Step number */}
        <div className={cn(
          "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm font-mono font-bold",
          isActive ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-500"
        )}>
          {index + 1}
        </div>

        {/* Flow visualization */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <div className={cn(
            "px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-xs font-mono",
            fromParticipant.bg,
            fromParticipant.text
          )}>
            {fromParticipant.short}
          </div>
          <ArrowRight className={cn(
            "w-3 h-3 sm:w-4 sm:h-4 transition-colors",
            isActive ? "text-gray-400" : "text-gray-600"
          )} />
          <div className={cn(
            "px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-xs font-mono",
            toParticipant.bg,
            toParticipant.text
          )}>
            {toParticipant.short}
          </div>
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <code className={cn(
            "text-xs sm:text-sm font-mono transition-colors",
            isActive ? "text-cyan-400" : "text-gray-500"
          )}>
            {step.label}
          </code>
        </div>

        {/* Type badge */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <span className={cn("w-2 h-2 rounded-full", typeStyle.color)} />
          <span className="text-xs text-gray-500">{typeStyle.label}</span>
        </div>

        {/* Code toggle */}
        {step.code && (
          <button
            onClick={() => setShowCode(!showCode)}
            className={cn(
              "flex-shrink-0 p-1.5 rounded-md transition-colors",
              showCode
                ? "bg-cyan-500/20 text-cyan-400"
                : "bg-gray-800 text-gray-500 hover:text-gray-300"
            )}
          >
            <Code2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Description */}
      {step.description && (
        <p className={cn(
          "text-xs pl-10 sm:pl-11 transition-colors",
          isActive ? "text-gray-400" : "text-gray-600"
        )}>
          {step.description}
        </p>
      )}

      {/* Code preview */}
      {showCode && step.code && (
        <div className="relative mt-2">
          <pre className="p-3 sm:p-4 rounded-lg bg-gray-950 border border-gray-800 text-xs font-mono text-gray-300 overflow-x-auto">
            {step.code}
          </pre>
          <CopyButton text={step.code} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// QUICK REFERENCE CARDS
// ============================================================================

function QuickReferenceCards() {
  const jsEvents = [
    { event: 'eventLogin()', desc: 'Initialize session with credentials', required: true },
    { event: 'eventPaymentGateway()', desc: 'Trigger native payment SDK', required: true },
    { event: 'eventDownload()', desc: 'Download files to device', required: true },
    { event: 'eventLocation()', desc: 'Request GPS coordinates', required: false },
    { event: 'eventRefreshToken()', desc: 'Refresh expired JWT', required: true },
    { event: 'eventShare()', desc: 'Native share sheet', required: false },
    { event: 'eventAnalytics()', desc: 'Track custom events', required: false },
  ];

  const s2sEndpoints = [
    { method: 'GET', endpoint: '/s2s/api/v1/user/profile', desc: 'Fetch user details', auth: 'API Key' },
    { method: 'POST', endpoint: '/s2s/api/v1/payment/init', desc: 'Initialize payment', auth: 'API Key' },
    { method: 'GET', endpoint: '/s2s/api/v1/payment/{id}', desc: 'Check payment status', auth: 'API Key' },
    { method: 'POST', endpoint: '/s2s/api/v1/refund', desc: 'Process refund', auth: 'API Key' },
    { method: 'GET', endpoint: '/s2s/api/v1/flight/orders', desc: 'List user bookings', auth: 'API Key' },
  ];

  const webhookEvents = [
    { event: 'PAYMENT_COMPLETED', desc: 'Payment successful' },
    { event: 'PAYMENT_FAILED', desc: 'Payment failed' },
    { event: 'BOOKING_CONFIRMED', desc: 'Booking with PNR' },
    { event: 'BOOKING_CANCELLED', desc: 'Booking cancelled' },
    { event: 'REFUND_PROCESSED', desc: 'Refund completed' },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* JS Bridge Events */}
      <div className="rounded-2xl bg-gray-900/50 border border-gray-800 p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-white mb-4">
          <Smartphone className="w-5 h-5 text-rose-400" />
          JS Bridge Events
        </h3>
        <div className="space-y-2">
          {jsEvents.map((item) => (
            <div key={item.event} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-800/50">
              <div className="flex items-center gap-2">
                <code className="text-xs sm:text-sm font-mono text-cyan-400">{item.event}</code>
                {item.required && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
                    Required
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <a href="/docs/integration/events" className="flex items-center gap-1 mt-4 text-sm text-blue-400 hover:text-blue-300">
          View full documentation <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* S2S API Endpoints */}
      <div className="rounded-2xl bg-gray-900/50 border border-gray-800 p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-white mb-4">
          <Server className="w-5 h-5 text-emerald-400" />
          S2S API Endpoints
        </h3>
        <div className="space-y-2">
          {s2sEndpoints.map((item) => (
            <div key={item.endpoint} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-800/50">
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0",
                item.method === 'GET' ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
              )}>
                {item.method}
              </span>
              <code className="text-xs font-mono text-gray-300 truncate">{item.endpoint}</code>
            </div>
          ))}
        </div>
        <a href="/docs/integration/authentication" className="flex items-center gap-1 mt-4 text-sm text-blue-400 hover:text-blue-300">
          View authentication docs <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Webhook Events */}
      <div className="rounded-2xl bg-gray-900/50 border border-gray-800 p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-white mb-4">
          <Webhook className="w-5 h-5 text-pink-400" />
          Webhook Events
        </h3>
        <div className="space-y-2">
          {webhookEvents.map((item) => (
            <div key={item.event} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-800/50">
              <code className="text-xs sm:text-sm font-mono text-pink-400">{item.event}</code>
              <span className="text-xs text-gray-500 hidden sm:block">{item.desc}</span>
            </div>
          ))}
        </div>
        <a href="/docs/integration/webhooks" className="flex items-center gap-1 mt-4 text-sm text-blue-400 hover:text-blue-300">
          View webhook docs <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HighLevelOverview() {
  const [activePhase, setActivePhase] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const currentPhase = phases[activePhase];
  const progress = ((activeStep + 1) / currentPhase.steps.length) * 100;

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && activePhase > 0) {
      setActivePhase(activePhase - 1);
      setActiveStep(0);
      setIsPlaying(false);
    } else if (e.key === 'ArrowRight' && activePhase < phases.length - 1) {
      setActivePhase(activePhase + 1);
      setActiveStep(0);
      setIsPlaying(false);
    } else if (e.key === ' ') {
      e.preventDefault();
      setIsPlaying(!isPlaying);
      if (!isPlaying) setActiveStep(0);
    }
  }, [activePhase, isPlaying]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Auto-advance through steps when playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= currentPhase.steps.length - 1) {
          if (activePhase < phases.length - 1) {
            setActivePhase(activePhase + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return prev;
          }
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying, activePhase, currentPhase.steps.length]);

  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500 to-teal-600',
    blue: 'from-blue-500 to-cyan-600',
    violet: 'from-violet-500 to-purple-600',
    amber: 'from-amber-500 to-orange-600',
  };

  return (
    <div className="space-y-8 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-800">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(55 65 81) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }} />
        </div>

        {/* Gradient orbs */}
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative p-6 sm:p-8 lg:p-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Integration Architecture
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            High Level Overview
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mb-2">
            Complete integration flow between your native application and OnArrival&apos;s
            flight booking platform.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Use arrow keys to navigate phases, spacebar to play/pause animation.
          </p>

          {/* Participants row */}
          <div className="flex items-center justify-between max-w-3xl mb-8 px-2 sm:px-4 overflow-x-auto">
            {(Object.keys(participants) as ParticipantKey[]).map((key, idx) => {
              const p = participants[key];
              const isInCurrentPhase = currentPhase.steps.some(
                s => s.from === key || s.to === key
              );
              return (
                <React.Fragment key={key}>
                  <ParticipantNode
                    participant={p}
                    isActive={isInCurrentPhase}
                  />
                  {idx < 4 && (
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 mx-1 sm:mx-2 min-w-[20px]" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Phase selector */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {phases.map((phase, idx) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                index={idx}
                isActive={activePhase === idx}
                progress={activePhase === idx && isPlaying ? progress : undefined}
                onClick={() => {
                  setActivePhase(idx);
                  setActiveStep(0);
                  setIsPlaying(false);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Architecture Diagram */}
      <ArchitectureDiagram />

      {/* Active Phase Details */}
      <div className="rounded-2xl bg-gray-900/50 border border-gray-800 overflow-hidden">
        {/* Phase header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br",
              colorMap[currentPhase.color]
            )}>
              <currentPhase.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Phase {activePhase + 1}: {currentPhase.title}
              </h2>
              <p className="text-sm text-gray-400">{currentPhase.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation buttons */}
            <button
              onClick={() => {
                if (activePhase > 0) {
                  setActivePhase(activePhase - 1);
                  setActiveStep(0);
                  setIsPlaying(false);
                }
              }}
              disabled={activePhase === 0}
              className={cn(
                "p-2 rounded-lg transition-colors",
                activePhase === 0
                  ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setIsPlaying(!isPlaying);
                if (!isPlaying) setActiveStep(0);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                isPlaying
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              )}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Play</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (activePhase < phases.length - 1) {
                  setActivePhase(activePhase + 1);
                  setActiveStep(0);
                  setIsPlaying(false);
                }
              }}
              disabled={activePhase === phases.length - 1}
              className={cn(
                "p-2 rounded-lg transition-colors",
                activePhase === phases.length - 1
                  ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="p-4 sm:p-6 space-y-3">
          {currentPhase.steps.map((step, idx) => (
            <FlowStepCard
              key={idx}
              step={step}
              index={idx}
              isActive={!isPlaying || idx <= activeStep}
              isAnimating={isPlaying && idx === activeStep}
            />
          ))}
        </div>
      </div>

      {/* Quick Reference Cards */}
      <QuickReferenceCards />

      {/* Environment Config */}
      <div className="rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Environment Configuration</h3>
            <p className="text-sm text-gray-400">Complete UAT testing before requesting production credentials</p>
          </div>
          <div className="flex gap-4 sm:gap-6">
            <div className="text-left sm:text-right">
              <div className="text-xs text-gray-500 mb-1">UAT Environment</div>
              <code className="text-sm font-mono text-cyan-400">devflights.onarriv.io</code>
            </div>
            <div className="w-px bg-gray-700" />
            <div className="text-left sm:text-right">
              <div className="text-xs text-gray-500 mb-1">Production</div>
              <span className="text-sm text-gray-400">After sign-off</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Handling Note */}
      <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-5 sm:p-6">
        <div className="flex gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-amber-400 mb-2">Error Handling</h3>
            <p className="text-sm text-gray-400 mb-3">
              Implement proper error handling for all integration points. Handle JWT expiration with
              <code className="mx-1 px-1.5 py-0.5 rounded bg-gray-800 text-cyan-400">eventRefreshToken()</code>
              and payment failures gracefully.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded bg-gray-800 text-xs text-gray-400">401 → Refresh token</span>
              <span className="px-2 py-1 rounded bg-gray-800 text-xs text-gray-400">Payment failed → Show retry</span>
              <span className="px-2 py-1 rounded bg-gray-800 text-xs text-gray-400">Network error → Offline queue</span>
            </div>
          </div>
        </div>
      </div>

      {/* Token Refresh Flow */}
      <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-5 sm:p-6">
        <div className="flex gap-4">
          <RefreshCw className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-blue-400 mb-2">Token Refresh Flow</h3>
            <p className="text-sm text-gray-400 mb-3">
              When the JWT expires (HTTP 401), the PWA calls <code className="mx-1 px-1.5 py-0.5 rounded bg-gray-800 text-cyan-400">eventRefreshToken()</code>
              to request a fresh token from the native app.
            </p>
            <div className="relative">
              <pre className="p-3 rounded-lg bg-gray-900 border border-gray-800 text-xs font-mono text-gray-300 overflow-x-auto">
{`// On 401 response
window.JSBridge.eventRefreshToken({
  reason: "TOKEN_EXPIRED"
});

// Native app callback with new token
onTokenRefreshed({ jwt: "new_token..." });`}
              </pre>
              <CopyButton text={`// On 401 response
window.JSBridge.eventRefreshToken({
  reason: "TOKEN_EXPIRED"
});

// Native app callback with new token
onTokenRefreshed({ jwt: "new_token..." });`} />
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: 'Pre-Requisites', href: '/docs/integration/pre-requisites', icon: CheckCircle2, color: 'emerald' },
          { title: 'Authentication', href: '/docs/integration/authentication', icon: Shield, color: 'blue' },
          { title: 'Payments', href: '/docs/integration/payments', icon: CreditCard, color: 'violet' },
          { title: 'Webhooks', href: '/docs/integration/webhooks', icon: Webhook, color: 'pink' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="group flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-all hover:scale-[1.02]"
          >
            <link.icon className={cn(
              "w-4 h-4 sm:w-5 sm:h-5",
              link.color === 'emerald' && "text-emerald-400",
              link.color === 'blue' && "text-blue-400",
              link.color === 'violet' && "text-violet-400",
              link.color === 'pink' && "text-pink-400",
            )} />
            <span className="text-xs sm:text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              {link.title}
            </span>
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 ml-auto group-hover:text-gray-400 transition-colors" />
          </a>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-4 text-sm">
        {Object.entries(typeStyles).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full", value.color)} />
            <span className="text-gray-400 text-xs sm:text-sm">{value.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HighLevelOverview;
