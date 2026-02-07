'use client';
import React, { useEffect, useState, useRef } from 'react';
import site from '../content/site';
import Container from '../components/ui/Container';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import Card from '../components/ui/Card';

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function HomePage() {
  const [calendlyLoaded, setCalendlyLoaded] = useState(false);
  const [calendlyError, setCalendlyError] = useState(false);
  const calendlyRef = useRef<HTMLDivElement | null>(null);
  const [calendlyHeight, setCalendlyHeight] = useState<number>(520);
 
  // derive availability from content values (placeholders indicate not configured)
  const calendlyUrl = site.contact.calendlyUrl;
  const whatsappNumber = site.contact.whatsappNumber;
  const hasCalendly = calendlyUrl && !calendlyUrl.includes('PLACEHOLDER');
  const hasWhatsApp = whatsappNumber && !whatsappNumber.includes('PLACEHOLDER');

  useEffect(() => {
    if (!hasCalendly) return;
    // if iframe doesn't call onLoad within 4s, show fallback
    const t = setTimeout(() => {
      if (!calendlyLoaded) setCalendlyError(true);
    }, 4000);
    return () => clearTimeout(t);
  }, [hasCalendly, calendlyLoaded]);

  // set a responsive height for the Calendly widget to avoid internal scrolling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function calcHeight() {
      const vh = window.innerHeight;
      // quick-fix: aim for ~90% of viewport to avoid internal scrolling
      let h = Math.floor(vh * 0.9);
      if (h < 480) h = 480;
      if (h > 1200) h = 1200;
      setCalendlyHeight(h);
    }
    calcHeight();
    window.addEventListener('resize', calcHeight);
    return () => window.removeEventListener('resize', calcHeight);
  }, []);

  // load Calendly widget script & css for inline embed
  useEffect(() => {
    if (!hasCalendly || calendlyError) return;
    // if Calendly already injected, nothing to do
    if (typeof window !== 'undefined' && (window as any).Calendly) {
      setCalendlyLoaded(true);
      return;
    }

    const cssHref = 'https://assets.calendly.com/assets/external/widget.css';
    const jsSrc = 'https://assets.calendly.com/assets/external/widget.js';
    let cssEl: HTMLLinkElement | null = null;
    let scriptEl: HTMLScriptElement | null = null;

    // inject css
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      cssEl = document.createElement('link');
      cssEl.rel = 'stylesheet';
      cssEl.href = cssHref;
      document.head.appendChild(cssEl);
    }

    // inject script
    if (!document.querySelector(`script[src="${jsSrc}"]`)) {
      scriptEl = document.createElement('script');
      scriptEl.src = jsSrc;
      scriptEl.async = true;
      scriptEl.onload = () => {
        setCalendlyLoaded(true);
      };
      scriptEl.onerror = () => {
        setCalendlyError(true);
        console.warn('Failed to load Calendly widget script');
      };
      document.body.appendChild(scriptEl);
    } else {
      // already present but not yet initialised
      setTimeout(() => setCalendlyLoaded(true), 500);
    }

    return () => {
      // leave script/css in place (shared across app). no cleanup.
    };
  }, [hasCalendly, calendlyError]);

  // Contact form removed — we surface Calendly, email, and WhatsApp CTAs instead.

  const services = site.services.slice();
  // ensure 4 cards by duplicating if needed
  while (services.length < 4) {
    services.push(site.services[0]);
  }

  return (
    <main>
      {/* Hero */}
      <Section id="hero" className="min-h-[50vh] flex items-center py-12 md:py-20">
        <div className="w-full bg-gradient-to-br from-parabolica-700 to-parabolica text-white rounded-surface p-8 md:p-16">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-sm uppercase tracking-wider text-parabolica-50">
                  {site.hero.eyebrow}
                </p>
                <h1 className="mt-4 text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                  {site.hero.title}
                </h1>
                <p className="mt-6 text-lg md:text-xl text-parabolica-50 max-w-3xl">
                  {site.hero.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    onClick={() => scrollToId('contact')}
                    className="shadow-lg"
                  >
                    {site.hero.primaryCta.label}
                  </Button>

                  {hasWhatsApp ? (
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-white/30 text-white rounded-pill text-sm font-semibold hover:bg-white/5"
                    >
                      {site.hero.secondaryCta.label}
                    </a>
                  ) : (
                    <a
                      href="#contact"
                      className="inline-flex items-center px-4 py-2 border border-white/30 text-white rounded-pill text-sm font-semibold hover:bg-white/5"
                    >
                      Contact us
                    </a>
                  )}
                </div>
              </div>

              <div className="order-first md:order-last">
                {/* Illustration placeholder */}
                <div className="w-full h-56 md:h-72 lg:h-96 bg-white/10 rounded-surface flex items-center justify-center">
                  <img src={site.hero.image} alt="" className="max-h-full" />
                </div>
              </div>
            </div>
          </Container>
        </div>
      </Section>

      

 

      {/* Services grid */}
      <Section id="services" className="py-8">
        <Container>
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold">Our services</h2>
            <p className="mt-2 text-neutral-600 max-w-2xl">{site.meta.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, idx) => (
              <Card key={`${s.id}-${idx}`} className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-neutral-600">{s.description}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(s.features || []).map((f, i) => (
                    <Chip key={i}>{f}</Chip>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Why Parabolica */}
      <Section id="differentiators" className="py-16">
        <Container>
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Most MVPs break in production. We make them reliable.
            </h2>
            <p className="mt-4 text-neutral-600 whitespace-normal">
              We harden MVPs for real-world usage: scalable architecture, automated delivery, security baselines, and observability — so your team can ship faster with confidence.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Architecture',
                description: 'Scalable foundations and clean boundaries to reduce rewrites.',
              },
              {
                title: 'CI/CD',
                description: 'Automated builds and safe deployments for stress-free releases.',
              },
              {
                title: 'Security',
                description: 'Secure-by-default auth, data handling, and API protection.',
              },
              {
                title: 'Observability',
                description: 'Logs, metrics, and alerts that catch issues early.',
              },
              {
                title: 'Performance',
                description: 'Faster pages and APIs with measurable speed targets.',
              },
              {
                title: 'Cost',
                description: 'Efficient infrastructure that scales without surprise bills.',
              },
              {
                title: 'Data reliability',
                description: 'Validated pipelines so dashboards and models stay accurate.',
              },
            ].map((b) => (
              <div key={b.title} className="bg-neutral-100 p-4 rounded-surface">
                <h3 className="text-sm font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm text-neutral-600 whitespace-normal">{b.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Work / Case studies (removed) */}
      {/* Process */}
      <Section id="process" className="py-16">
        <Container>
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold">Our process</h2>
            <p className="mt-2 text-neutral-600 max-w-2xl">Fast, iterative, and focused on outcomes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {site.process.map((s) => (
              <Card key={s.title} className="p-6">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-3 text-sm text-neutral-600">{s.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQs */}
      {site.faqs && site.faqs.length > 0 && (
        <Section id="faqs" className="py-12">
          <Container>
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold">Common questions</h2>
              <p className="mt-2 text-neutral-600 max-w-2xl">Everything you need to know about working with us.</p>
            </div>

            <div className="space-y-3 max-w-4xl">
              {site.faqs.map((f, i) => (
                <details
                  key={i}
                  className="group bg-white border border-neutral-200 rounded-surface"
                >
                  <summary className="cursor-pointer select-none px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-4">
                    <span className="text-sm md:text-base font-medium text-neutral-900">{f.question}</span>
                    <span className="ml-4 text-neutral-500 group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <div className="px-4 pb-4 md:px-6 md:pb-6">
                    <p className="text-sm text-neutral-600">{f.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Expertise */}
      <Section id="expertise" className="py-12">
        <Container>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Expertise</h2>
          <div className="flex flex-wrap gap-3">
            {[
              'Web & Mobile',
              'AI/ML',
              'IoT & Embedded',
              'Data & Analytics',
              'Cloud/DevOps',
              'Security',
              'Observability',
            ].map((e) => (
              <Chip key={e}>{e}</Chip>
            ))}
          </div>
        </Container>
      </Section>

      {/* Contact */}
      <Section id="contact" className="py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div>
              <h2 className="text-2xl md:text-3xl font-semibold">{site.contact.heading}</h2>
              {site.contact.bullets ? (
                <ul className="mt-4 text-neutral-600 max-w-lg list-disc list-inside space-y-2">
                  {site.contact.bullets.map((b, i) => (
                    <li key={i} className="text-sm">{b}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-neutral-600 max-w-lg">{(site.contact as any).description ?? ''}</p>
              )}

              <div className="mt-6">
                <p className="text-sm text-neutral-700">Email</p>
                <a className="text-parabolica font-semibold" href={`mailto:${site.contact.email}`}>
                  {site.contact.email}
                </a>
              </div>
            </div>

            <div>
              {/* Calendly embed */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2">Schedule a demo</h3>
                {hasCalendly && !calendlyError ? (
                  <div className="rounded-surface overflow-hidden border border-neutral-100">
                    {/* Calendly inline embed: widget script will transform this div */}
                    <div
                      ref={calendlyRef}
                      className="calendly-inline-widget w-full"
                      data-url={calendlyUrl}
                      style={{ minWidth: 320, height: calendlyHeight }}
                    />
                    {!calendlyLoaded && (
                      <div className="mt-2 text-sm text-neutral-500">Loading scheduler…</div>
                    )}
                  </div>
                ) : hasCalendly && calendlyError ? (
                  <div className="rounded-surface overflow-hidden border border-neutral-100 p-4">
                    <p className="text-sm text-neutral-600 mb-2">
                      The embedded scheduler couldn't load (your browser or Calendly may block embeds).
                    </p>
                    <a
                      href={calendlyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-parabolica text-white rounded-surface text-sm font-semibold"
                    >
                      Open scheduling page
                    </a>
                  </div>
                ) : (
                  <div className="text-sm text-neutral-500">
                    Calendly not configured — <a href="#contact" className="text-parabolica">contact us</a>.
                  </div>
                )}
              </div>

              {/* Contact CTA */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Contact</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Schedule a demo, message us on WhatsApp, or email — we typically respond within 4 hours.
                </p>
                <div className="flex flex-wrap gap-3">
                  {hasCalendly && (
                    <a
                      href={calendlyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-parabolica text-white rounded-surface text-sm font-semibold"
                    >
                      Schedule a demo
                    </a>
                  )}

                  {hasWhatsApp && (
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-neutral-200 rounded-surface text-sm font-semibold"
                    >
                      Message on WhatsApp
                    </a>
                  )}

                  <a
                    href={`mailto:${site.contact.email}`}
                    className="inline-flex items-center px-4 py-2 border border-neutral-200 rounded-surface text-sm font-semibold"
                  >
                    Email us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* WhatsApp floating button */}
      {hasWhatsApp ? (
        <a
          aria-label="Chat on WhatsApp"
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi Parabolica — I have a project.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed right-6 bottom-6 z-50 inline-flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-full shadow-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M21 12a9 9 0 10-2.34 5.86L21 21l-3.14-1.16A9 9 0 0021 12z" fill="white" />
          </svg>
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      ) : (
        <a
          aria-label="Contact"
          href="#contact"
          className="fixed right-6 bottom-6 z-50 inline-flex items-center gap-3 px-4 py-3 bg-parabolica text-white rounded-full shadow-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" fill="white" />
          </svg>
          <span className="hidden sm:inline">Contact</span>
        </a>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral-100 py-12">
        <Container>
          <div className="flex flex-col md:flex-row md:justify-between gap-8">
            <div>
              <img src="/brand/logo-1-color.png" alt="Parabolica" className="h-8 mb-4" />
              <p className="text-sm text-neutral-600 max-w-md">{site.meta.description}</p>
            </div>

            <div className="flex gap-12">
              {site.footer.columns.map((col) => (
                <div key={col.heading}>
                  <h4 className="text-sm font-semibold mb-3">{col.heading}</h4>
                  <ul className="flex flex-col gap-2">
                    {col.links.map((l) => (
                      <li key={l.href}>
                        <a href={l.href} className="text-sm text-neutral-600 hover:text-parabolica">
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-sm text-neutral-500">{site.footer.smallPrint}</div>
        </Container>
      </footer>

    </main>
  );
}

