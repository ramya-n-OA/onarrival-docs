'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Step {
  from: string;
  to: string;
  label: string;
  description?: string;
  type?: 'request' | 'response' | 'event' | 'callback';
  code?: string;
}

interface SequenceDiagramProps {
  title: string;
  participants: string[];
  steps: Step[];
}

const participantColors: Record<string, string> = {
  'Native App': 'bg-pink-100 border-pink-300 text-pink-800',
  'JS Bridge': 'bg-purple-100 border-purple-300 text-purple-800',
  'PWA': 'bg-blue-100 border-blue-300 text-blue-800',
  'OnArrival': 'bg-emerald-100 border-emerald-300 text-emerald-800',
  'Partner Backend': 'bg-amber-100 border-amber-300 text-amber-800',
};

const typeColors: Record<string, string> = {
  request: 'bg-blue-500',
  response: 'bg-emerald-500',
  event: 'bg-purple-500',
  callback: 'bg-amber-500',
};

export function SequenceDiagram({ title, participants, steps }: SequenceDiagramProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>

      {/* Participants */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        {participants.map((p, i) => (
          <div
            key={i}
            className="flex-1 p-3 text-center border-r last:border-r-0 border-gray-200 dark:border-gray-800"
          >
            <div className={cn(
              'inline-block px-3 py-1.5 rounded-lg text-sm font-medium border',
              participantColors[p] || 'bg-gray-100 border-gray-300 text-gray-800'
            )}>
              {p}
            </div>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {steps.map((step, i) => {
          const isExpanded = expandedStep === i;

          return (
            <div key={i} className="relative">
              <button
                onClick={() => setExpandedStep(isExpanded ? null : i)}
                className="w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center px-4 py-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400 mr-3">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'inline-block w-2 h-2 rounded-full',
                        typeColors[step.type || 'request']
                      )} />
                      <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                        {step.label}
                      </code>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {step.from} → {step.to}
                      {step.description && ` • ${step.description}`}
                    </div>
                  </div>
                  {step.code && (
                    <div className="flex-shrink-0 ml-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
              </button>

              {isExpanded && step.code && (
                <div className="px-4 pb-4">
                  <pre className="p-3 rounded-lg bg-gray-900 text-gray-100 text-xs overflow-x-auto">
                    <code>{step.code}</code>
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Pre-built integration flow
export function IntegrationFlowDiagram() {
  const participants = ['Native App', 'JS Bridge', 'PWA', 'OnArrival', 'Partner Backend'];

  const steps: Step[] = [
    {
      from: 'Native App',
      to: 'JS Bridge',
      label: 'eventLogin()',
      description: 'Request user credentials',
      type: 'event',
    },
    {
      from: 'JS Bridge',
      to: 'PWA',
      label: 'Create Session',
      description: 'Initialize booking session',
      type: 'request',
    },
    {
      from: 'PWA',
      to: 'OnArrival',
      label: 'Check authentication/token',
      description: 'Validate JWT token',
      type: 'request',
    },
    {
      from: 'OnArrival',
      to: 'PWA',
      label: 'Validate or reject',
      description: 'Token verification result',
      type: 'response',
    },
    {
      from: 'OnArrival',
      to: 'Partner Backend',
      label: 'GET /user/profile',
      description: 'Fetch user profile via S2S',
      type: 'request',
      code: `GET /user/profile HTTP/1.1
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json`,
    },
    {
      from: 'JS Bridge',
      to: 'Native App',
      label: 'eventLocation() / eventDeviceInfo()',
      description: 'Request device context',
      type: 'event',
    },
    {
      from: 'PWA',
      to: 'PWA',
      label: 'Booking Flow',
      description: 'Search, select, review',
      type: 'request',
    },
    {
      from: 'PWA',
      to: 'OnArrival',
      label: 'Payment initialization',
      description: 'User initiates payment',
      type: 'request',
    },
    {
      from: 'OnArrival',
      to: 'Partner Backend',
      label: 'POST /payment/init',
      description: 'Initialize payment on partner side',
      type: 'request',
      code: `POST /payment/init HTTP/1.1
x-api-key: <API_KEY>
userId: <USER_ID>

{
  "amountInCash": 5000,
  "amountInCoins": 500,
  "totalAmount": 5500,
  "orderId": "ORD123456789",
  "transactionId": "TXN987654321"
}`,
    },
    {
      from: 'Partner Backend',
      to: 'OnArrival',
      label: 'paymentGatewayMetaInfo',
      description: 'Gateway initialization data',
      type: 'response',
    },
    {
      from: 'JS Bridge',
      to: 'Native App',
      label: 'eventPaymentGateway(payload)',
      description: 'Trigger native payment SDK',
      type: 'event',
    },
    {
      from: 'Native App',
      to: 'JS Bridge',
      label: 'Post Payment callback',
      description: 'Payment result from gateway',
      type: 'callback',
      code: `{
  "status": "SUCCESS",
  "data": {
    "transactionId": "TXN456",
    "amountPaid": 5500
  }
}`,
    },
    {
      from: 'OnArrival',
      to: 'Partner Backend',
      label: 'GET /payment/status (poll) or Webhook',
      description: 'Verify payment status',
      type: 'request',
    },
    {
      from: 'OnArrival',
      to: 'PWA',
      label: 'Booking confirmed',
      description: 'On success, generate booking',
      type: 'response',
    },
    {
      from: 'JS Bridge',
      to: 'Native App',
      label: 'eventDownload()',
      description: 'Download ticket/invoice',
      type: 'event',
    },
  ];

  return (
    <div className="space-y-4">
      <SequenceDiagram
        title="Mobile App & PWA Integration Flow"
        participants={participants}
        steps={steps}
      />
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Request</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-gray-600 dark:text-gray-400">Response</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-gray-600 dark:text-gray-400">Event</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-gray-600 dark:text-gray-400">Callback</span>
        </div>
      </div>
    </div>
  );
}
