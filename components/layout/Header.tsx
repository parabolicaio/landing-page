'use client';
import React, { useEffect, useRef, useState } from 'react';
import Container from '../ui/Container';

const NAV_ITEMS = [
  { label: 'Services', href: '#services' },
  { label: 'Why', href: '#differentiators' },
  { label: 'Process', href: '#process' },
  { label: 'Contact', href: '#contact' },
];

function ScrollToAnchor(href?: string) {
  if (!href) return;
  try {
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    // ignore
  }
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab' && open && overlayRef.current) {
        // basic focus trap
        const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
          'a,button,[tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!document.activeElement) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      // lock body scroll
      document.body.style.overflow = 'hidden';
      // focus the close button after open
      setTimeout(() => closeButtonRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = '';
      // restore focus
      prevFocusRef.current?.focus?.();
    }
  }, [open]);

  return (
    <header className="sticky top-4 z-50 pointer-events-auto">
      <Container className="!px-4">
        <div className="bg-white rounded-surface shadow-md backdrop-blur-sm border border-gray-100">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            {/* Left: logo */}
            <div className="flex items-center shrink-0">
              <a href="#" aria-label="Parabolica home" onClick={(e) => e.preventDefault()}>
                <img src="/brand/logo-2-color.png" alt="Parabolica" className="h-8 w-auto" />
              </a>
            </div>

            {/* Center: nav */}
            <nav className="hidden md:flex gap-8 items-center" aria-label="Primary">
              {NAV_ITEMS.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={(e) => {
                    e.preventDefault();
                    ScrollToAnchor(n.href);
                  }}
                  className="text-sm font-medium text-neutral-700 hover:text-parabolica transition-colors focus:outline-none focus:ring-2 focus:ring-parabolica-100 rounded"
                >
                  {n.label}
                </a>
              ))}
            </nav>

            {/* Right: actions */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <button
                  onClick={() => ScrollToAnchor('#contact')}
                  className="inline-flex items-center px-4 py-2 bg-parabolica text-white rounded-surface text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-parabolica-200"
                >
                  Book a call
                </button>
              </div>

              {/* Mobile hamburger */}
              <div className="md:hidden">
                <button
                  aria-expanded={open}
                  aria-controls="mobile-menu"
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm focus:outline-none focus:ring-4 focus:ring-parabolica-100"
                >
                  <span className="sr-only">Open menu</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 7h16M4 12h16M4 17h16" stroke="#0B0F12" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Mobile menu overlay */}
      {open && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          ref={overlayRef}
          className="fixed inset-0 z-50 bg-white flex flex-col p-6"
        >
          <div className="flex items-center justify-between">
            <a href="#" onClick={(e) => e.preventDefault()} aria-label="Parabolica home">
              <img src="/brand/logo-2-color.png" alt="Parabolica" className="h-8 w-auto" />
            </a>
            <div className="flex items-center gap-3">
              <button
                ref={closeButtonRef}
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm focus:outline-none focus:ring-4 focus:ring-parabolica-100"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M6 18L18 6" stroke="#0B0F12" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <nav className="mt-12 flex-1 flex flex-col gap-6" aria-label="Mobile">
            {NAV_ITEMS.map((n) => (
              <React.Fragment key={n.href}>
                <a
                  href={n.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    ScrollToAnchor(n.href);
                  }}
                  className="text-2xl font-semibold text-neutral-900"
                >
                  {n.label}
                </a>
                <div className="border-t border-gray-100" />
              </React.Fragment>
            ))}
          </nav>

          <div className="mt-8">
            <button
              onClick={() => {
                setOpen(false);
                ScrollToAnchor('#contact');
              }}
              className="w-full inline-flex items-center justify-center px-6 py-4 bg-parabolica text-white rounded-surface text-lg font-semibold focus:outline-none focus:ring-4 focus:ring-parabolica-200"
            >
              Book a call
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

