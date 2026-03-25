// ABOUTME: Woven by Toyota company page — uses the shared company page template design system
// ABOUTME: Accent color: red (#DC2626). Sections: Hero, About, Divisions, Interview, Culture

import React from 'react';
import {
  Shield,
  Globe,
  Building2,
  TrendingUp,
  Lightbulb,
  Car,
  Code,
  Award,
  Zap,
  Heart,
  Check,
  type LucideProps,
} from 'lucide-react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/lazy-image';
import { RevealSection, SectionHeader } from '@/components/company';
import { HERO_STATS, PILLARS, DIVISIONS, INTERVIEW_STEPS, CULTURE_REASONS } from './data';
import '@/styles/companyTemplate.css';

const ACCENT = '#DC2626';
const ACCENT_DIM = 'rgba(220,38,38,0.12)';

type LucideIcon = React.ComponentType<LucideProps>;
const ICON_MAP: Record<string, LucideIcon> = {
  Shield, Globe, Building2, TrendingUp, Lightbulb, Car, Code, Award, Zap, Heart,
};

// ── Page component ──────────────────────────────────────────

const WovenCompanyPage: React.FC = () => {
  return (
    <div
      className="company-page"
      style={{ '--color-accent': ACCENT, '--color-accent-dim': ACCENT_DIM } as React.CSSProperties}
    >
      <NavigationHeader />

      {/* ─── Hero ────────────────────────────────────────── */}
      <section className="company-hero-bg company-hero-vh">
        <div className="page-container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Companies', href: '/company' },
              { label: 'Woven by Toyota' },
            ]}
            className="mb-6"
          />
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <div className="company-hero-enter">
                <span className="section-label">Woven by Toyota</span>
              </div>
              <h1 className="hero-title company-hero-enter" style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
                Building the<br />Future of<br />
                <span style={{ color: ACCENT }}>Mobility</span>
              </h1>
              <p className="company-hero-enter body-text" style={{ maxWidth: '560px', marginBottom: '1.5rem' }}>
                Toyota's mobility technology subsidiary developing the software behind Toyota's vehicle operating
                systems, automated driving, and smart city initiatives like Woven City.
              </p>
              <div className="company-hero-enter flex flex-wrap gap-3 mb-6">
                {HERO_STATS.map((stat) => (
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

            {/* Right: office image */}
            <div className="company-hero-enter hidden lg:block" style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  borderRadius: '2px',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                  aspectRatio: '4/3',
                }}
              >
                <LazyImage
                  src="/woven-office-image.jpg"
                  alt="Woven by Toyota Modern Office"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Page Navigation ─────────────────────────────── */}
      <div className="company-page-nav">
        <div className="page-container">
          <nav className="flex justify-center items-center gap-8">
            <a href="#about" className="company-nav-link">About</a>
            <a href="#divisions" className="company-nav-link">Divisions</a>
            <a href="#interview" className="company-nav-link">Interview</a>
            <a href="#culture" className="company-nav-link">Culture</a>
          </nav>
        </div>
      </div>

      {/* ─── About ───────────────────────────────────────── */}
      <section id="about" className="section-padding" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="page-container">
          <RevealSection>
            <SectionHeader label="Company Overview" heading="About Woven by Toyota" />
            <p className="body-text" style={{ maxWidth: '800px', marginBottom: '3rem' }}>
              <strong style={{ color: 'var(--color-text-1)' }}>Woven by Toyota</strong> is Toyota's mobility
              technology subsidiary, responsible for developing and integrating the software behind Toyota's vehicle
              operating systems, automated driving, advanced safety technologies, and smart city initiatives such as
              Woven City.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {PILLARS.map(({ icon, title, description }) => {
                const Icon = ICON_MAP[icon];
                return (
                  <div key={title} className="text-center">
                    <div className="pillar-icon">
                      <Icon className="w-7 h-7" style={{ color: ACCENT }} />
                    </div>
                    <h3
                      className="font-bold text-lg mb-2"
                      style={{ color: 'var(--color-text-1)', fontFamily: 'Syne, system-ui, sans-serif' }}
                    >
                      {title}
                    </h3>
                    <p className="body-text" style={{ fontSize: '0.9375rem' }}>
                      {description}
                    </p>
                  </div>
                );
              })}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── Divisions ───────────────────────────────────── */}
      <section
        id="divisions"
        className="section-padding"
        style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="page-container">
          <RevealSection>
            <SectionHeader label="Products" heading="Divisions" />
            <p className="body-text mb-8">
              Woven by Toyota focuses on 5 main areas, from self-driving and smart city to Software-Defined Vehicles and enterprise AI.
            </p>
            <div className="space-y-4">
              {DIVISIONS.map(({ icon, iconColor, iconBg, title, description, highlights }) => {
                const Icon = ICON_MAP[icon];
                const resolvedColor = iconColor === 'accent' ? ACCENT : iconColor;
                const resolvedBg = iconBg === 'accent-dim' ? ACCENT_DIM : iconBg;
                return (
                  <div key={title} className="division-card">
                    <div className="flex items-start gap-6">
                      <div className="division-icon-wrap" style={{ background: resolvedBg }}>
                        <Icon className="w-6 h-6" style={{ color: resolvedColor }} />
                      </div>
                      <div className="flex-1">
                        <h3
                          className="font-bold text-lg mb-3"
                          style={{ color: 'var(--color-text-1)', fontFamily: 'Syne, system-ui, sans-serif' }}
                        >
                          {title}
                        </h3>
                        <p className="body-text mb-4" style={{ fontSize: '0.9375rem' }}>
                          {description}
                        </p>
                        <ul className="space-y-2">
                          {highlights.map((h) => (
                            <li key={h} className="flex items-center gap-3">
                              <div className="division-check-dot">
                                <Check className="w-2.5 h-2.5" style={{ color: 'var(--color-bg)' }} />
                              </div>
                              <span className="text-sm" style={{ color: 'var(--color-text-2)' }}>
                                {h}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── Interview Process ────────────────────────────── */}
      <section id="interview" className="section-padding" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="page-container">
          <RevealSection>
            <SectionHeader label="Hiring" heading="Interview Process" />
            <p className="body-text mb-12">
              Woven by Toyota's interview process takes 5–7 weeks on average, with 4–5 steps.
            </p>
            <div className="grid md:grid-cols-4 gap-8">
              {INTERVIEW_STEPS.map(({ num, title, description }) => (
                <div key={num} className="interview-step">
                  <div className="interview-step-num">{num}</div>
                  <h3
                    className="font-bold text-lg mb-2"
                    style={{ color: 'var(--color-text-1)', fontFamily: 'Syne, system-ui, sans-serif' }}
                  >
                    {title}
                  </h3>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-2)', lineHeight: '1.6' }}>
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── Culture ─────────────────────────────────────── */}
      <section
        id="culture"
        className="section-padding"
        style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="page-container">
          <RevealSection>
            <SectionHeader label="Culture" heading="Why Woven by Toyota?" />
            <p className="body-text mb-12" style={{ maxWidth: '680px' }}>
              Woven by Toyota offers an English-driven international environment modelled after Silicon Valley tech
              startup culture.
            </p>
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* YouTube video */}
              <div>
                <div
                  style={{
                    borderRadius: '2px',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                    aspectRatio: '16/9',
                  }}
                >
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/2Euzdn8fPJo"
                    title="Woven by Toyota Office Tour"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* Reasons */}
              <div className="space-y-6">
                {CULTURE_REASONS.map(({ icon, title, description }) => {
                  const Icon = ICON_MAP[icon];
                  return (
                    <div key={title} className="flex items-start gap-4">
                      <div className="culture-reason-icon">
                        <Icon className="w-5 h-5" style={{ color: ACCENT }} />
                      </div>
                      <div>
                        <h4 className="font-bold mb-1" style={{ color: 'var(--color-text-1)' }}>
                          {title}
                        </h4>
                        <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-2)', lineHeight: '1.6' }}>
                          {description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
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

export default WovenCompanyPage;
