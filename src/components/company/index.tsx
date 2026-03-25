// Shared components for company pages — used with companyTemplate.css
import React from 'react';
import { useCompanyReveal } from '@/hooks/useCompanyReveal';

export function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useCompanyReveal();
  return (
    <div ref={ref} className={`company-reveal ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({ label, heading }: { label: string; heading: string }) {
  return (
    <div className="mb-8">
      <span className="section-label">{label}</span>
      <div className="section-rule" />
      <h2 className="section-heading">{heading}</h2>
    </div>
  );
}
