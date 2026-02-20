'use client';

import React, { useState, useMemo } from 'react';
import { Search, AlertCircle, CheckCircle, Zap, ChevronDown, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  id: string;
  question: string;
  category: 'auth' | 'payment' | 'webhook' | 'general';
  severity: 'critical' | 'common' | 'edge-case';
  scenario?: string;
  cause?: string;
  resolution: string;
  code?: string;
  identifiers?: Array<{ name: string; value: string }>;
}

const faqs: FAQItem[] = [
  {
    id: 'auth-url-fail',
    question: 'Demo URLs fail when opened in mobile browser',
    category: 'auth',
    severity: 'common',
    scenario: 'Demo or integration URLs fail when opened directly in a mobile browser',
    cause: 'Demo links are designed to be accessed only from within the client mobile application',
    resolution: 'Load URL inside mobile webview → Trigger eventLogin → Pass valid user token',
    code: '// Correct flow\n1. Load in webview\n2. window.JSBridge.eventLogin({ jwt: "...", userId: "..." })\n3. Token bypasses guest restrictions',
  },
  {
    id: 'flight-not-available',
    question: 'Flight service is not available',
    category: 'auth',
    severity: 'critical',
    cause: 'Valid authentication token is not being passed to the platform',
    resolution: 'Ensure: Token generated correctly → Token passed via eventLogin → Token verified by backend',
  },
  {
    id: 'payment-stuck',
    question: 'User stuck on Payment Processing screen',
    category: 'payment',
    severity: 'critical',
    scenario: 'User completes payment at PG but PWA shows Payment Processing',
    cause: 'Backend payment confirmation not received by OnArrival',
    resolution: 'Partner verify: Webhook URL config → Payload schema → Signature validation. OnArrival falls back to polling if webhook missing.',
  },
  {
    id: 'webhook-400',
    question: 'Payment webhook returning HTTP 400',
    category: 'webhook',
    severity: 'common',
    cause: '400 errors indicate payload/schema mismatches',
    resolution: 'Share exact CURL request payload: Full body → Headers → Timestamp → Environment details',
  },
  {
    id: 'retry-amount-different',
    question: 'Retry payment showing different amount',
    category: 'payment',
    severity: 'edge-case',
    scenario: 'User retries payment and amount differs from previous attempt',
    cause: 'Retry payments validated against latest fare. Amount changes expected if fare refreshed.',
    resolution: 'Normal behavior. Investigate only if: Amount changes repeatedly within seconds → Pricing differs without retry',
  },
  {
    id: 'booking-id',
    question: 'When to use Booking ID vs Payment ID?',
    category: 'general',
    severity: 'common',
    resolution: 'Booking ID: booking operations. Payment ID: payment status/refunds. Transaction ID: idempotency.',
    identifiers: [
      { name: 'Booking ID', value: 'Primary key for booking operations' },
      { name: 'Payment ID', value: 'Reference for payment status/refunds' },
      { name: 'Transaction ID', value: 'Idempotency key (prevents duplicates)' },
    ],
  },
];

const categories = {
  all: { label: 'All Issues' },
  auth: { label: 'Authentication' },
  payment: { label: 'Payment' },
  webhook: { label: 'Webhooks' },
  general: { label: 'General' },
};

const severityConfig = {
  critical: { label: 'Critical', icon: AlertCircle, color: 'text-red-400 bg-red-500/10' },
  common: { label: 'Common', icon: Zap, color: 'text-amber-400 bg-amber-500/10' },
  'edge-case': { label: 'Edge Case', icon: CheckCircle, color: 'text-blue-400 bg-blue-500/10' },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  if (copied) {
    return (
      <button 
        onClick={handleCopy} 
        className="p-1.5 rounded hover:bg-gray-700 transition-colors"
        aria-label="Copy to clipboard"
      >
        <Check className="w-4 h-4 text-emerald-400" />
      </button>
    );
  }
  
  return (
    <button 
      onClick={handleCopy} 
      className="p-1.5 rounded hover:bg-gray-700 transition-colors"
      aria-label="Copy to clipboard"
    >
      <Copy className="w-4 h-4 text-gray-400" />
    </button>
  );
}

export function IntegrationFAQ() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.resolution.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' || faq.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Integration FAQ</h1>
        <p className="text-gray-400">Common integration issues and their resolutions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {Object.entries(categories).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                category === key
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500">{filtered.length} issues found</p>

      <div className="space-y-3">
        {filtered.map((faq) => {
          const isExpanded = expandedId === faq.id;
          const SeverityIcon = severityConfig[faq.severity].icon;

          return (
            <div
              key={faq.id}
              className={cn(
                "rounded-xl border transition-all",
                isExpanded
                  ? "bg-gray-800/60 border-gray-600"
                  : "bg-gray-900/50 border-gray-800 hover:border-gray-700"
              )}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                className="w-full flex items-center justify-between gap-4 p-4 text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn("p-2 rounded-lg", severityConfig[faq.severity].color)}>
                    <SeverityIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium">{faq.question}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{categories[faq.category].label}</span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-500">{severityConfig[faq.severity].label}</span>
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-gray-400 transition-transform flex-shrink-0",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-700/50 pt-4">
                  {faq.scenario && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1">SCENARIO</p>
                      <p className="text-sm text-gray-300">{faq.scenario}</p>
                    </div>
                  )}
                  {faq.cause && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1">CAUSE</p>
                      <p className="text-sm text-gray-300">{faq.cause}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-1">RESOLUTION</p>
                    <p className="text-sm text-gray-300">{faq.resolution}</p>
                  </div>
                  {faq.code && (
                    <div className="relative">
                      <pre className="p-3 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                        {faq.code}
                      </pre>
                      <div className="absolute top-2 right-2">
                        <CopyButton text={faq.code} />
                      </div>
                    </div>
                  )}
                  {faq.identifiers && (
                    <div className="grid gap-2">
                      {faq.identifiers.map((id) => (
                        <div key={id.name} className="flex items-center justify-between p-2 rounded bg-gray-800/50">
                          <span className="text-sm font-mono text-cyan-400">{id.name}</span>
                          <span className="text-xs text-gray-400">{id.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No matching issues found</p>
        </div>
      )}
    </div>
  );
}