// ABOUTME: Shippio company page — uses the shared company page template design system
// ABOUTME: Accent color: teal (#00C2A8). Sections: Hero, About, Products, Funding, Tech Stack, Global Presence, CTA

import React, { useEffect, useRef, useCallback } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { SHIPPIO } from './data';
import '@/styles/companyTemplate.css';

const ACCENT = '#00C2A8';
const ACCENT_DIM = 'rgba(0,194,168,0.12)';

// ── Scroll-reveal hook ──────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`company-reveal ${className}`}>
      {children}
    </div>
  );
}

// ── Animated counter ────────────────────────────────────────
function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    const el = ref.current;
    if (!el || hasAnimated.current) return;
    hasAnimated.current = true;

    const numMatch = value.match(/[\d.]+/);
    if (!numMatch) {
      el.textContent = value;
      return;
    }

    const target = parseFloat(numMatch[0]);
    const prefix = value.slice(0, value.indexOf(numMatch[0]));
    const suffix = value.slice(value.indexOf(numMatch[0]) + numMatch[0].length);
    const isInteger = !numMatch[0].includes('.');
    const duration = 1200;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      if (el) {
        el.textContent = prefix + (isInteger ? Math.round(current).toString() : current.toFixed(1)) + suffix;
      }
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  return (
    <div className="text-center">
      <span ref={ref} className="stat-value block">
        {value}
      </span>
      <span className="text-sm mt-1 block" style={{ color: 'var(--color-text-2)' }}>
        {label}
      </span>
    </div>
  );
}

function SectionHeader({ label, heading }: { label: string; heading: string }) {
  return (
    <div className="mb-8">
      <span className="section-label">{label}</span>
      <div className="section-rule" />
      <h2 className="section-heading">{heading}</h2>
    </div>
  );
}

// ── Main page component ─────────────────────────────────────
const ShippioCompanyPage: React.FC = () => {
  return (
    <div
      className="company-page"
      style={{ '--color-accent': ACCENT, '--color-accent-dim': ACCENT_DIM } as React.CSSProperties}
    >
      <NavigationHeader />

      {/* ─── Hero ────────────────────────────────────────── */}
      <section className="company-hero-bg company-hero-vh">
        <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Companies', href: '/company' },
              { label: 'Shippio' },
            ]}
            className="mb-6"
          />
          <div className="company-hero-enter">
            <span className="section-label">Shippio, Inc.</span>
          </div>
          <h1 className="hero-title company-hero-enter" style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
            Japan's First<br />Digital Freight<br />Forwarder
          </h1>
          <p className="company-hero-enter body-text" style={{ maxWidth: '640px', marginBottom: '1.5rem' }}>
            {SHIPPIO.description}
          </p>
          <div className="company-hero-enter flex flex-wrap gap-3 mb-6">
            {SHIPPIO.stats.map((stat) => (
              <div key={stat.label} className="stat-pill">
                <span className="stat-pill-label">{stat.label}:</span>
                <span>{stat.value}</span>
              </div>
            ))}
          </div>
          <div className="company-hero-enter">
            <Button
              size="lg"
              variant="outline"
              className="company-learn-more-btn"
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Page Navigation ─────────────────────────────── */}
      <div className="company-page-nav">
        <div className="page-container">
          <nav className="flex justify-center items-center gap-8">
            <a href="#about" className="company-nav-link">About</a>
            <a href="#products" className="company-nav-link">Products</a>
            <a href="#funding" className="company-nav-link">Funding</a>
            <a href="#tech-stack" className="company-nav-link">Tech Stack</a>
            <a href="#global" className="company-nav-link">Global Presence</a>
          </nav>
        </div>
      </div>

      {/* ─── About ───────────────────────────────────────── */}
      <section id="about" className="section-padding" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="page-container">
          <RevealSection>
            <SectionHeader label="Company Overview" heading="About Shippio" />
            <div className="grid gap-6" style={{ maxWidth: '800px' }}>
              {SHIPPIO.about.map((paragraph, i) => (
                <p key={i} className="body-text">
                  {paragraph}
                </p>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── Products ────────────────────────────────────── */}
      <section
        id="products"
        className="section-padding"
        style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="page-container">
          <RevealSection>
            <SectionHeader label="Products" heading="The Shippio Platform" />
            <div className="grid md:grid-cols-3 gap-6">
              {SHIPPIO.products.map((product) => (
                <div key={product.name} className="company-card">
                  <h3
                    className="font-bold text-lg mb-3"
                    style={{ color: 'var(--color-text-1)', fontFamily: 'Syne, system-ui, sans-serif' }}
                  >
                    {product.name}
                  </h3>
                  <p className="body-text" style={{ fontSize: '0.9375rem' }}>
                    {product.description}
                  </p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── Funding & Traction ───────────────────────────── */}
      <section id="funding" className="section-padding" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="page-container">
          <RevealSection>
            <SectionHeader label="Funding & Traction" heading="Growth Timeline" />
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="timeline">
                {SHIPPIO.fundingRounds.map((round) => (
                  <div key={round.round} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-year">{round.year}</div>
                    <div className="timeline-round">{round.round}</div>
                    <div className="timeline-detail">
                      {round.amount}
                      {round.lead ? ` — Led by ${round.lead}` : ''}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-8">
                <AnimatedStat value="¥7B" label="Total Raised" />
                <AnimatedStat value="$46M" label="USD Equivalent" />
                <AnimatedStat value="200%" label="Revenue Growth YoY" />
                <AnimatedStat value="$1.8M" label="Revenue (2024)" />
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── Tech Stack ──────────────────────────────────── */}
      <section
        id="tech-stack"
        className="section-padding"
        style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="page-container">
          <RevealSection>
            <SectionHeader label="Engineering" heading="Tech Stack" />
            <div className="space-y-8">
              {Object.entries(SHIPPIO.techStack).map(([category, items]) => (
                <div key={category}>
                  <h3
                    className="text-xs uppercase tracking-widest mb-3"
                    style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--color-text-3)' }}
                  >
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <span key={item} className="tech-tag">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── Global Presence ─────────────────────────────── */}
      <section id="global" className="section-padding" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="page-container">
          <RevealSection>
            <SectionHeader label="Global Presence" heading="Office Locations" />
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {SHIPPIO.offices.map((office) => (
                <div key={office.city} className="company-card flex flex-col items-start gap-2">
                  <MapPin className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <div
                      className="font-bold text-lg"
                      style={{ color: 'var(--color-text-1)', fontFamily: 'Syne, system-ui, sans-serif' }}
                    >
                      {office.city}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--color-text-2)' }}>
                      {office.region}
                    </div>
                    {office.detail && (
                      <div className="text-xs mt-1" style={{ color: 'var(--color-text-3)' }}>
                        {office.detail}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────── */}
      <section className="section-padding" style={{ textAlign: 'center' }}>
        <div className="page-container">
          <RevealSection>
            <span className="section-label">Learn More</span>
            <div className="section-rule" style={{ margin: '0.75rem auto 1rem' }} />
            <h2 className="section-heading mb-4">Interested in Shippio?</h2>
            <p className="body-text mb-8 mx-auto" style={{ maxWidth: '520px' }}>
              Shippio is growing fast and hiring across engineering, product, and operations. Explore open roles or
              learn more about the company.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a
                href="https://www.shippio.io/en/"
                target="_blank"
                rel="noopener noreferrer"
                className="company-cta-btn"
              >
                Visit shippio.io
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://www.shippio.io/en/careers/"
                target="_blank"
                rel="noopener noreferrer"
                className="company-cta-outline"
              >
                Careers
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────── */}
      <footer
        className="py-6"
        style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}
      >
        <div className="page-container text-center text-sm" style={{ color: 'var(--color-text-3)' }}>
          &copy; 2026 Omiyages. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default ShippioCompanyPage;
