'use client';

import React, { useState, useEffect } from 'react';
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
  ExternalLink,
} from 'lucide-react';

// Participant definitions with colors
const participants = {
  native: {
    name: 'Native App',
    short: 'Native',
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
    color: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
    icon: Globe,
  },
  onarrival: {
    name: 'OnArrival',
    short: 'OA',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    icon: Server,
  },
  partner: {
    name: 'Partner BE',
    short: 'Partner',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    icon: Database,
  },
};

type ParticipantKey = keyof typeof participants;

interface FlowStep {
  from: ParticipantKey;
  to: ParticipantKey;
  label: string;
  type: 'request' | 'response' | 'event' | 'callback';
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

const phases: Phase[] = [
  {
    id: 'auth',
    title: 'Authentication',
    subtitle: 'Session & Identity',
    icon: Shield,
    color: 'emerald',
    description: 'Establish user identity via JWT validation and fetch profile context through S2S APIs.',
    steps: [
      { from: 'native', to: 'bridge', label: 'eventLogin()', type: 'event' },
      { from: 'bridge', to: 'pwa', label: 'Create Session', type: 'request' },
      { from: 'pwa', to: 'onarrival', label: 'Validate JWT', type: 'request', code: 'Authorization: Bearer <JWT>' },
      { from: 'onarrival', to: 'partner', label: 'GET /user/profile', type: 'request', code: 'x-api-key: <API_KEY>' },
      { from: 'partner', to: 'onarrival', label: 'User Profile', type: 'response' },
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
      { from: 'bridge', to: 'native', label: 'eventLocation()', type: 'event' },
      { from: 'native', to: 'bridge', label: 'Coordinates', type: 'callback' },
      { from: 'pwa', to: 'onarrival', label: 'Search Flights', type: 'request' },
      { from: 'onarrival', to: 'pwa', label: 'Aggregated Results', type: 'response' },
      { from: 'pwa', to: 'pwa', label: 'Select & Review', type: 'request' },
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
      { from: 'pwa', to: 'onarrival', label: 'Init Payment', type: 'request' },
      { from: 'onarrival', to: 'partner', label: 'POST /payment/init', type: 'request', code: '{\n  "amount": 5500,\n  "orderId": "ORD123"\n}' },
      { from: 'partner', to: 'onarrival', label: 'Gateway Meta', type: 'response' },
      { from: 'bridge', to: 'native', label: 'eventPaymentGateway()', type: 'event' },
      { from: 'native', to: 'bridge', label: 'Payment Result', type: 'callback', code: '{\n  "status": "SUCCESS",\n  "utr": "UTR123"\n}' },
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
      { from: 'onarrival', to: 'partner', label: 'Webhook: PAYMENT_COMPLETED', type: 'event' },
      { from: 'onarrival', to: 'pwa', label: 'Booking Confirmed', type: 'response', code: '{\n  "pnr": "ABC123",\n  "status": "CONFIRMED"\n}' },
      { from: 'bridge', to: 'native', label: 'eventDownload()', type: 'event' },
      { from: 'onarrival', to: 'partner', label: 'Webhook: BOOKING_CONFIRMED', type: 'event' },
    ],
  },
];

const typeStyles = {
  request: { color: 'bg-blue-500', label: 'Request' },
  response: { color: 'bg-emerald-500', label: 'Response' },
  event: { color: 'bg-violet-500', label: 'Event' },
  callback: { color: 'bg-amber-500', label: 'Callback' },
};

// Participant node component
function ParticipantNode({
  participant,
  isActive
}: {
  participant: typeof participants.native;
  isActive: boolean;
}) {
  const Icon = participant.icon;

  return (
    <div className={cn(
      "flex flex-col items-center gap-2 transition-all duration-300",
      isActive ? "scale-110" : "scale-100 opacity-60"
    )}>
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
        participant.bg,
        participant.border,
        isActive && `shadow-lg ${participant.glow}`
      )}>
        <Icon className={cn("w-5 h-5", participant.text)} />
      </div>
      <span className={cn(
        "text-xs font-mono transition-colors duration-300",
        isActive ? participant.text : "text-gray-500"
      )}>
        {participant.short}
      </span>
    </div>
  );
}

// Phase card component
function PhaseCard({
  phase,
  isActive,
  onClick,
  index
}: {
  phase: Phase;
  isActive: boolean;
  onClick: () => void;
  index: number;
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
        "group relative flex flex-col items-start p-5 rounded-2xl border transition-all duration-300",
        "hover:scale-[1.02] active:scale-[0.98]",
        isActive
          ? "bg-gray-800/80 border-gray-600 shadow-xl"
          : "bg-gray-900/50 border-gray-800 hover:border-gray-700"
      )}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Phase number badge */}
      <div className={cn(
        "absolute -top-3 -left-3 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white",
        `bg-gradient-to-br ${colorMap[phase.color]}`,
        isActive && "shadow-lg"
      )}>
        {index + 1}
      </div>

      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300",
        isActive
          ? `bg-gradient-to-br ${colorMap[phase.color]} shadow-lg`
          : "bg-gray-800"
      )}>
        <Icon className={cn(
          "w-5 h-5 transition-colors duration-300",
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

      {/* Active indicator */}
      {isActive && (
        <div className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full",
          `bg-gradient-to-r ${colorMap[phase.color]}`
        )} />
      )}
    </button>
  );
}

// Flow step component
function FlowStep({
  step,
  index,
  isActive
}: {
  step: FlowStep;
  index: number;
  isActive: boolean;
}) {
  const [showCode, setShowCode] = useState(false);
  const fromParticipant = participants[step.from];
  const toParticipant = participants[step.to];
  const typeStyle = typeStyles[step.type];

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
        isActive
          ? "bg-gray-800/60 border-gray-700"
          : "bg-gray-900/30 border-gray-800/50 opacity-50"
      )}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Step number */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono font-bold",
        isActive ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-500"
      )}>
        {index + 1}
      </div>

      {/* Flow visualization */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className={cn(
          "px-2 py-1 rounded-md text-xs font-mono",
          fromParticipant.bg,
          fromParticipant.text
        )}>
          {fromParticipant.short}
        </div>
        <ArrowRight className={cn(
          "w-4 h-4 transition-colors",
          isActive ? "text-gray-400" : "text-gray-600"
        )} />
        <div className={cn(
          "px-2 py-1 rounded-md text-xs font-mono",
          toParticipant.bg,
          toParticipant.text
        )}>
          {toParticipant.short}
        </div>
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <code className={cn(
          "text-sm font-mono transition-colors",
          isActive ? "text-cyan-400" : "text-gray-500"
        )}>
          {step.label}
        </code>
      </div>

      {/* Type badge */}
      <div className={cn(
        "flex-shrink-0 flex items-center gap-2"
      )}>
        <span className={cn(
          "w-2 h-2 rounded-full",
          typeStyle.color
        )} />
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

      {/* Code preview */}
      {showCode && step.code && (
        <div className="absolute top-full left-12 right-4 mt-2 z-10">
          <pre className="p-3 rounded-lg bg-gray-950 border border-gray-800 text-xs font-mono text-gray-300 overflow-x-auto">
            {step.code}
          </pre>
        </div>
      )}
    </div>
  );
}

// Main component
export function HighLevelOverview() {
  const [activePhase, setActivePhase] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Auto-advance through steps when playing
  useEffect(() => {
    if (!isPlaying) return;

    const currentPhase = phases[activePhase];
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= currentPhase.steps.length - 1) {
          // Move to next phase
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
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying, activePhase]);

  const currentPhase = phases[activePhase];

  return (
    <div className="space-y-8">
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative p-8 lg:p-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Integration Architecture
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            High Level Overview
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mb-8">
            Complete integration flow between your native application and OnArrival&apos;s
            flight booking platform. Hybrid PWA + Native SDK for optimal performance.
          </p>

          {/* Participants row */}
          <div className="flex items-center justify-between max-w-3xl mb-8 px-4">
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
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 mx-2" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Phase selector */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {phases.map((phase, idx) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                index={idx}
                isActive={activePhase === idx}
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

      {/* Active Phase Details */}
      <div className="rounded-2xl bg-gray-900/50 border border-gray-800 overflow-hidden">
        {/* Phase header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br",
              currentPhase.color === 'emerald' && "from-emerald-500 to-teal-600",
              currentPhase.color === 'blue' && "from-blue-500 to-cyan-600",
              currentPhase.color === 'violet' && "from-violet-500 to-purple-600",
              currentPhase.color === 'amber' && "from-amber-500 to-orange-600",
            )}>
              <currentPhase.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Phase {activePhase + 1}: {currentPhase.title}
              </h2>
              <p className="text-sm text-gray-400">{currentPhase.description}</p>
            </div>
          </div>

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
            <Play className={cn("w-4 h-4", isPlaying && "animate-pulse")} />
            {isPlaying ? 'Stop' : 'Animate Flow'}
          </button>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-3">
          {currentPhase.steps.map((step, idx) => (
            <FlowStep
              key={idx}
              step={step}
              index={idx}
              isActive={!isPlaying || idx <= activeStep}
            />
          ))}
        </div>
      </div>

      {/* Quick Reference */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Frontend Events */}
        <div className="rounded-2xl bg-gray-900/50 border border-gray-800 p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Smartphone className="w-5 h-5 text-rose-400" />
            JS Bridge Events
          </h3>
          <div className="space-y-2">
            {[
              { event: 'eventLogin()', desc: 'Get user credentials' },
              { event: 'eventPaymentGateway()', desc: 'Trigger payment SDK' },
              { event: 'eventDownload()', desc: 'Download files' },
              { event: 'eventLocation()', desc: 'Get device location' },
              { event: 'eventRefreshToken()', desc: 'Refresh expired token' },
            ].map((item) => (
              <div key={item.event} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                <code className="text-sm font-mono text-cyan-400">{item.event}</code>
                <span className="text-sm text-gray-500">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Backend APIs */}
        <div className="rounded-2xl bg-gray-900/50 border border-gray-800 p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Server className="w-5 h-5 text-emerald-400" />
            S2S API Endpoints
          </h3>
          <div className="space-y-2">
            {[
              { method: 'GET', endpoint: '/user/profile', desc: 'JWT Auth' },
              { method: 'POST', endpoint: '/payment/init', desc: 'S2S Auth' },
              { method: 'GET', endpoint: '/payment/{id}', desc: 'S2S Auth' },
              { method: 'POST', endpoint: '/refund', desc: 'S2S Auth' },
              { method: 'GET', endpoint: '/s2s/api/v1/flight/orders', desc: 'S2S Auth' },
            ].map((item) => (
              <div key={item.endpoint} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-bold",
                  item.method === 'GET' ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                )}>
                  {item.method}
                </span>
                <code className="text-sm font-mono text-gray-300 flex-1">{item.endpoint}</code>
                <span className="text-xs text-gray-500">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Environment Config */}
      <div className="rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Environment Configuration</h3>
            <p className="text-sm text-gray-400">Complete UAT testing before requesting production credentials</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">UAT</div>
              <code className="text-sm font-mono text-cyan-400">devflights.onarriv.io</code>
            </div>
            <div className="w-px bg-gray-700" />
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Production</div>
              <span className="text-sm text-gray-400">After sign-off</span>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Pre-Requisites', href: '/docs/integration/pre-requisites', icon: CheckCircle2, color: 'emerald' },
          { title: 'Authentication', href: '/docs/integration/authentication', icon: Shield, color: 'blue' },
          { title: 'Payments', href: '/docs/integration/payments', icon: CreditCard, color: 'violet' },
          { title: 'API Reference', href: '/docs/integration/api-reference', icon: Code2, color: 'amber' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="group flex items-center gap-3 p-4 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-all hover:scale-[1.02]"
          >
            <link.icon className={cn(
              "w-5 h-5",
              link.color === 'emerald' && "text-emerald-400",
              link.color === 'blue' && "text-blue-400",
              link.color === 'violet' && "text-violet-400",
              link.color === 'amber' && "text-amber-400",
            )} />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              {link.title}
            </span>
            <ExternalLink className="w-4 h-4 text-gray-600 ml-auto group-hover:text-gray-400 transition-colors" />
          </a>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 py-4 text-sm">
        {Object.entries(typeStyles).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full", value.color)} />
            <span className="text-gray-400">{value.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HighLevelOverview;
