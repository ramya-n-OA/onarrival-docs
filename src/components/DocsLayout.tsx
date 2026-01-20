'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  Home,
  BookOpen,
  Code,
  HelpCircle,
  Search,
  ChevronRight,
  ChevronLeft,
  Command,
  ExternalLink,
} from 'lucide-react';

const navigation = [
  {
    title: 'Getting Started',
    icon: Home,
    items: [
      { title: 'Overview', href: '/docs/introduction/overview' },
      { title: 'High Level Overview', href: '/docs/introduction/high-level-overview' },
      { title: 'Product & Integration', href: '/docs/introduction/product-integration' },
    ],
  },
  {
    title: 'Integration Guides',
    icon: BookOpen,
    items: [
      { title: 'Pre-Requisites', href: '/docs/integration/pre-requisites' },
      { title: 'Authentication Flow', href: '/docs/integration/authentication' },
      { title: 'User Profile API', href: '/docs/integration/user-profile' },
      { title: 'Payment & Refunds', href: '/docs/integration/payments' },
      { title: 'JS Bridge Events', href: '/docs/integration/events' },
      { title: 'Webhooks', href: '/docs/integration/webhooks' },
      { title: 'API Reference', href: '/docs/integration/api-reference' },
      { title: 'Edge Cases', href: '/docs/integration/edge-cases' },
    ],
  },
  {
    title: 'Sample Code',
    icon: Code,
    items: [
      { title: 'Flutter', href: '/docs/samples/flutter' },
      { title: 'React Native', href: '/docs/samples/react-native' },
      { title: 'Android / Swift', href: '/docs/samples/android-swift' },
    ],
  },
  {
    title: 'Support',
    icon: HelpCircle,
    items: [
      { title: 'FAQs', href: '/docs/support/faqs' },
      { title: 'Refund Scenarios', href: '/docs/support/refunds' },
    ],
  },
];

// Flatten navigation for prev/next
const flatNavigation = navigation.flatMap((section) => section.items);

interface DocsLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

// Search Modal Component
function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return flatNavigation.filter(
      (item) => item.title.toLowerCase().includes(q) || item.href.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm" />
      <div className="relative flex items-start justify-center pt-[20vh]">
        <div
          className="w-full max-w-xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documentation..."
              className="flex-1 bg-transparent text-gray-100 outline-none placeholder:text-gray-500"
              autoFocus
            />
            <kbd className="px-2 py-1 rounded bg-gray-800 text-xs text-gray-400 font-mono">
              ESC
            </kbd>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {results.length > 0 ? (
              <div className="p-2">
                {results.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-200">{item.title}</span>
                    <span className="text-xs text-gray-600 ml-auto font-mono">{item.href}</span>
                  </Link>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="p-8 text-center text-gray-500">
                No results found for &quot;{query}&quot;
              </div>
            ) : (
              <div className="p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">
                  Quick Links
                </div>
                {flatNavigation.slice(0, 5).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-300">{item.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Table of Contents Component
function TableOfContents({ pathname }: { pathname: string }) {
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Reset headings on page change
    setHeadings([]);
    setActiveId('');

    // Small delay to ensure content is rendered
    const timeout = setTimeout(() => {
      const article = document.querySelector('article');
      if (!article) return;

      const elements = article.querySelectorAll('h2, h3');
      const items = Array.from(elements).map((el) => ({
        id: el.id || el.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '',
        text: el.textContent || '',
        level: parseInt(el.tagName[1]),
      }));

      // Add IDs to headings that don't have them
      elements.forEach((el, idx) => {
        if (!el.id && items[idx]) {
          el.id = items[idx].id;
        }
      });

      setHeadings(items);

      // Intersection observer for active heading
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          });
        },
        { rootMargin: '-80px 0px -80% 0px' }
      );

      elements.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timeout);
  }, [pathname]);

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-1">
      {headings.map((heading) => (
        <a
          key={`${pathname}-${heading.id}`}
          href={`#${heading.id}`}
          className={cn(
            'block text-sm py-1 transition-colors',
            heading.level === 3 && 'pl-4',
            activeId === heading.id
              ? 'text-emerald-400 font-medium'
              : 'text-gray-500 hover:text-gray-300'
          )}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  );
}

export function DocsLayout({ children, title, description }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  // Find current, previous, and next pages
  const currentIndex = flatNavigation.findIndex((item) => item.href === pathname);
  const prevPage = currentIndex > 0 ? flatNavigation[currentIndex - 1] : null;
  const nextPage = currentIndex < flatNavigation.length - 1 ? flatNavigation[currentIndex + 1] : null;

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Top Navigation */}
      <header className="fixed top-0 z-40 w-full border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5 text-gray-400" /> : <Menu className="h-5 w-5 text-gray-400" />}
            </button>
            <Link href="/" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-gray-900 font-bold text-sm">OA</span>
              </div>
              <span className="font-semibold text-lg text-gray-100 hidden sm:block">OnArrival</span>
              <span className="text-gray-600 hidden sm:block">|</span>
              <span className="text-gray-400 text-sm hidden sm:block">Docs</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-gray-600 transition-colors"
            >
              <Search className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500 hidden md:block">Search docs...</span>
              <kbd className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded bg-gray-700 text-xs text-gray-400 font-mono">
                <Command className="w-3 h-3" />K
              </kbd>
            </button>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
            >
              Admin
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] w-72 shrink-0 overflow-y-auto border-r border-gray-800/50 bg-gray-950 transition-transform lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <nav className="p-4 space-y-6">
            {navigation.map((section) => (
              <div key={section.title}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3 px-3">
                  <section.icon className="h-4 w-4 text-gray-500" />
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'block px-3 py-2 rounded-lg text-sm transition-colors',
                          pathname === item.href
                            ? 'bg-emerald-500/10 text-emerald-400 font-medium border-l-2 border-emerald-500'
                            : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
                        )}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
            {title && (
              <div className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-100 mb-2">
                  {title}
                </h1>
                {description && (
                  <p className="text-lg text-gray-400">{description}</p>
                )}
              </div>
            )}
            <article className="prose prose-invert max-w-none prose-headings:scroll-mt-20 prose-headings:text-gray-100 prose-p:text-gray-400 prose-a:text-emerald-400 hover:prose-a:text-emerald-300 prose-strong:text-gray-200 prose-code:text-pink-400 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800 overflow-x-auto">
              {children}
            </article>

            {/* Previous/Next Navigation */}
            {(prevPage || nextPage) && (
              <div className="flex items-center justify-between mt-16 pt-8 border-t border-gray-800">
                {prevPage ? (
                  <Link
                    href={prevPage.href}
                    className="group flex items-center gap-3 p-4 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Previous</div>
                      <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                        {prevPage.title}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div />
                )}
                {nextPage && (
                  <Link
                    href={nextPage.href}
                    className="group flex items-center gap-3 p-4 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-all text-right"
                  >
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Next</div>
                      <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                        {nextPage.title}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Table of Contents */}
        <aside className="hidden xl:block w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-6">
          <div className="text-sm">
            <h4 className="font-semibold text-gray-300 mb-4">On this page</h4>
            <TableOfContents pathname={pathname} />
          </div>
        </aside>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
