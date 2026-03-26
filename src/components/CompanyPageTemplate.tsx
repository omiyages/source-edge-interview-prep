// ABOUTME: Shared template for all company profile pages
// ABOUTME: Fixed section order: Hero → Info → Mission → Services → Why Join → Roles → Courses
// ABOUTME: Roles and courses are fetched live from Supabase filtered by company name

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin, Users, DollarSign, Calendar, ChevronRight,
  Building2, Briefcase,
  Shield, Globe, TrendingUp, Lightbulb, Car, Code, Award, Zap, Heart,
  Check, Package, Star, Target, Cpu, Rocket, type LucideProps,
} from 'lucide-react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/lazy-image';
import { CourseCard } from '@/components/CourseCard';
import { useCompanyReveal } from '@/hooks/useCompanyReveal';
import { supabase } from '@/integrations/supabase/client';
import type { Role } from '@/types/role';
import type { Course } from '@/types/course';
import type { CompanyPageData, CompanyValue, CompanyService } from '@/types/company';

// ── Icon system ────────────────────────────────────────────────────────────────

type LucideIcon = React.ComponentType<LucideProps>;

const ICON_MAP: Record<string, LucideIcon> = {
  Shield, Globe, Building2, TrendingUp, Lightbulb, Car, Code, Award, Zap, Heart,
  Check, Package, Star, Target, Cpu, Rocket, MapPin, Users, DollarSign, Calendar,
  Briefcase,
};

function Icon({ name, className }: { name: string; className?: string }) {
  const Comp = ICON_MAP[name] ?? Building2;
  return <Comp className={className} />;
}

// ── Scroll-reveal wrapper ─────────────────────────────────────────────────────

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useCompanyReveal();
  return (
    <div ref={ref} className={`company-reveal ${className}`}>
      {children}
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ label, heading }: { label: string; heading: string }) {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        {label}
      </p>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground">{heading}</h2>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function HeroSection({ data }: { data: CompanyPageData }) {
  const logoBg = data.logoBg ?? 'bg-primary/20';
  const logoText = data.logoText ?? 'text-primary';

  return (
    <section
      className="relative bg-neutral-950 pt-16 pb-0 overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle, #1E2329 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-neutral-950 pointer-events-none z-10" />
      <div className="container mx-auto px-4 relative z-20">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Companies', href: '/company' },
            { label: data.name },
          ]}
          className="mb-8"
        />
        <div className="grid lg:grid-cols-2 gap-12 items-center pb-16">
          <div>
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${logoBg} ${logoText} font-bold text-lg mb-6`}>
              {data.logoLetter ?? data.name.charAt(0)}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight mb-4">
              {data.tagline}
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
              {data.description}
            </p>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {data.heroImage && (
            <div className="hidden lg:block rounded-xl overflow-hidden border border-neutral-800 aspect-[4/3]">
              <LazyImage
                src={data.heroImage}
                alt={data.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── 4 Info Blocks ─────────────────────────────────────────────────────────────

function InfoBlocks({ data }: { data: CompanyPageData }) {
  const blocks = [
    { icon: 'DollarSign', label: 'Funding',   value: data.funding },
    { icon: 'Users',      label: 'Team Size', value: data.size },
    { icon: 'MapPin',     label: 'Location',  value: data.location },
    { icon: 'Calendar',   label: 'Founded',   value: data.founded },
  ];

  return (
    <div className="bg-neutral-900 border-y border-neutral-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-neutral-800">
          {blocks.map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon name={icon} className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Mission & Values ──────────────────────────────────────────────────────────

function MissionSection({ data }: { data: CompanyPageData }) {
  return (
    <section id="about" className="py-20 border-b border-neutral-800">
      <div className="container mx-auto px-4">
        <RevealSection>
          <SectionHeading label="Company Overview" heading={`About ${data.name}`} />
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <p className="text-muted-foreground leading-relaxed text-base">{data.mission}</p>
            <div className="grid gap-6">
              {data.values.map((v) => (
                <ValueCard key={v.title} item={v} />
              ))}
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

function ValueCard({ item }: { item: CompanyValue }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon name={item.icon} className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
      </div>
    </div>
  );
}

// ── Services ──────────────────────────────────────────────────────────────────

function ServicesSection({ data }: { data: CompanyPageData }) {
  return (
    <section id="services" className="py-20 bg-neutral-900/50 border-b border-neutral-800">
      <div className="container mx-auto px-4">
        <RevealSection>
          <SectionHeading label="Products & Services" heading={data.servicesHeading ?? 'Services'} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.services.map((svc) => (
              <ServiceCard key={svc.title} item={svc} />
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

function ServiceCard({ item }: { item: CompanyService }) {
  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-5 hover:border-neutral-700 transition-colors">
      {item.icon && (
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
          <Icon name={item.icon} className="w-4 h-4 text-primary" />
        </div>
      )}
      <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.description}</p>
      {item.highlights && item.highlights.length > 0 && (
        <ul className="space-y-1.5">
          {item.highlights.map((h) => (
            <li key={h} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              {h}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Tech Stack ────────────────────────────────────────────────────────────────

function TechStackSection({ data }: { data: CompanyPageData }) {
  if (!data.techStack || Object.keys(data.techStack).length === 0) return null;

  return (
    <section id="tech-stack" className="py-20 border-b border-neutral-800">
      <div className="container mx-auto px-4">
        <RevealSection>
          <SectionHeading label="Engineering" heading="Tech Stack" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(data.techStack).map(([category, tags]) => (
              <div key={category} className="bg-neutral-900 rounded-lg border border-neutral-800 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  {category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md bg-neutral-800 border border-neutral-700 text-xs font-medium text-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ── Why Join ──────────────────────────────────────────────────────────────────

function WhyJoinSection({ data }: { data: CompanyPageData }) {
  return (
    <section id="why-join" className="py-20 border-b border-neutral-800">
      <div className="container mx-auto px-4">
        <RevealSection>
          <SectionHeading label="Culture & Benefits" heading={`Why Join ${data.name}?`} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.whyJoin.map((item) => (
              <div
                key={item.title}
                className="bg-neutral-900 rounded-lg border border-neutral-800 p-5 hover:border-neutral-700 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon name={item.icon} className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ── Open Roles ────────────────────────────────────────────────────────────────

function RolesSection({ roles, companyName, isLoading }: { roles: Role[]; companyName: string; isLoading: boolean }) {
  return (
    <section id="roles" className="py-20 bg-neutral-900/50 border-b border-neutral-800">
      <div className="container mx-auto px-4">
        <RevealSection>
          <div className="flex items-end justify-between mb-8">
            <SectionHeading label="Hiring" heading="Open Roles" />
            <Link
              to="/roles"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-8 shrink-0"
            >
              View all roles →
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 animate-pulse">
                  <div className="h-4 bg-neutral-700 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-neutral-700 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : roles.length > 0 ? (
            <div className="space-y-3">
              {roles.map((role) => (
                <RoleRow key={role.id} role={role} />
              ))}
            </div>
          ) : (
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-10 text-center">
              <Briefcase className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                No open roles at {companyName} right now. Check back soon.
              </p>
              <Link to="/roles">
                <Button variant="outline" size="sm" className="mt-4">
                  View All Open Roles
                </Button>
              </Link>
            </div>
          )}
        </RevealSection>
      </div>
    </section>
  );
}

function RoleRow({ role }: { role: Role }) {
  const href = role.slug ? `/job/${role.slug}` : `/roles`;
  return (
    <Link
      to={href}
      className="block bg-neutral-900 rounded-lg border border-neutral-800 p-5 hover:border-neutral-700 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 font-bold text-sm text-muted-foreground">
          {role.company.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {role.job_title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            <span className="text-sm text-muted-foreground">{role.company}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="bg-blue-900/40 text-blue-400 text-xs px-2 py-0.5 rounded-full font-medium">
              {role.working_style}
            </span>
            {role.japanese_level && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="bg-indigo-900/40 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-medium">
                  Japanese: {role.japanese_level}
                </span>
              </>
            )}
            {role.division && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="bg-cyan-900/40 text-cyan-400 text-xs px-2 py-0.5 rounded-full font-medium">
                  {role.division}
                </span>
              </>
            )}
            <span className="text-muted-foreground/40">·</span>
            <span className="text-sm text-muted-foreground">{role.location}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

// ── Associated Courses ────────────────────────────────────────────────────────

function CoursesSection({ courses, companyName, isLoading }: { courses: Course[]; companyName: string; isLoading: boolean }) {
  return (
    <section id="courses" className="py-20 border-b border-neutral-800">
      <div className="container mx-auto px-4">
        <RevealSection>
          <div className="flex items-end justify-between mb-8">
            <SectionHeading label="Learning" heading="Associated Courses" />
            <Link
              to="/courses"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-8 shrink-0"
            >
              Browse all courses →
            </Link>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden animate-pulse">
                  <div className="h-36 bg-neutral-800" />
                  <div className="p-5 space-y-2">
                    <div className="h-4 bg-neutral-700 rounded w-3/4" />
                    <div className="h-3 bg-neutral-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-10 text-center">
              <p className="text-muted-foreground text-sm">
                Interview prep courses for {companyName} are coming soon.
              </p>
              <Link to="/courses">
                <Button variant="outline" size="sm" className="mt-4">
                  Browse All Courses
                </Button>
              </Link>
            </div>
          )}
        </RevealSection>
      </div>
    </section>
  );
}

// ── Main template ─────────────────────────────────────────────────────────────

const CompanyPageTemplate: React.FC<{ data: CompanyPageData }> = ({ data }) => {
  const companyFilter = data.companyFilterName ?? data.name;

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['roles', 'company', companyFilter],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('roles')
        .select('*')
        .ilike('company', companyFilter)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (rows ?? []) as unknown as Role[];
    },
    staleTime: 2 * 60_000,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['courses', 'company', companyFilter],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('courses')
        .select('id, title, description, company, attached_jobs, created_at, created_by')
        .ilike('company', companyFilter)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (rows ?? []) as unknown as Course[];
    },
    staleTime: 5 * 60_000,
  });

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <NavigationHeader />
      <HeroSection data={data} />
      <InfoBlocks data={data} />
      <MissionSection data={data} />
      <ServicesSection data={data} />
      <TechStackSection data={data} />
      <WhyJoinSection data={data} />
      <RolesSection roles={roles} companyName={data.name} isLoading={rolesLoading} />
      <CoursesSection courses={courses} companyName={data.name} isLoading={coursesLoading} />
      <footer className="bg-neutral-900 border-t border-neutral-800 mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Omiyages. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default CompanyPageTemplate;
